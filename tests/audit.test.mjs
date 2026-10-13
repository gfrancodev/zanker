import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {auditURL, collectPageDiagnostics, validateMotion, validateSchemes, validateViewports} from '../src/audit.mjs';
import {makeFakeChromium, withStubDocument} from './fake-browser.mjs';

const URL_LOCAL = 'http://127.0.0.1:4173/';

// Always awaited, so an async body finishes before the fixture is removed.
async function withProject(body) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-audit-'));
  fs.writeFileSync(path.join(project, 'package.json'), '{"name":"fixture"}');
  try {
    return await body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

/** Installs a stand in for axe-core so the optional path is reachable. */
function installFakeAxe(project) {
  const moduleDirectory = path.join(project, 'node_modules', 'axe-core');
  fs.mkdirSync(moduleDirectory, {recursive: true});
  fs.writeFileSync(path.join(moduleDirectory, 'package.json'), '{"name":"axe-core","version":"0.0.0","main":"index.js"}');
  fs.writeFileSync(path.join(moduleDirectory, 'index.js'), 'module.exports = {};\n');
  fs.writeFileSync(path.join(moduleDirectory, 'axe.min.js'), 'window.axe = {run(){}};\n');
}

test('viewports are parsed, bounded and capped', () => {
  assert.deepEqual(validateViewports('375x812,1440x900'), [{width: 375, height: 812}, {width: 1440, height: 900}]);
  assert.equal(validateViewports(undefined).length, 3, 'phone, tablet and desktop by default');
  assert.throws(() => validateViewports('wide'), /Invalid viewport wide/);
  assert.throws(() => validateViewports('375x'), /Invalid viewport/);
  assert.throws(() => validateViewports('10x10'), /Viewport outside safe limits/, 'the parser accepts it, the limits do not');
  assert.throws(() => validateViewports('100x100'), /Viewport outside safe limits/);
  assert.throws(() => validateViewports('9999x900'), /Viewport outside safe limits/);
  assert.throws(() => validateViewports('375x9999'), /Viewport outside safe limits/);
  assert.throws(() => validateViewports(Array.from({length: 13}, () => '375x812').join(',')), /Maximum 12 viewports/);
});

test('color schemes and motion preferences are validated', () => {
  assert.deepEqual(validateSchemes(undefined), ['light', 'dark']);
  assert.deepEqual(validateSchemes('dark'), ['dark']);
  assert.deepEqual(validateSchemes('dark, dark ,light'), ['dark', 'light'], 'duplicates collapse');
  assert.throws(() => validateSchemes('sepia'), /Invalid color scheme sepia/);
  assert.throws(() => validateSchemes(','), /At least one color scheme required/);
  assert.equal(validateMotion(undefined), 'reduce', 'reduced motion is the safer default');
  assert.equal(validateMotion('no-preference'), 'no-preference');
  assert.throws(() => validateMotion('spin'), /Motion must be reduce or no-preference/);
});

test('every scheme and viewport combination is captured', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium({diagnostics: {title: 'Home', hasHorizontalOverflow: false}});
    const {report, out} = await auditURL({
      project, url: URL_LOCAL, viewports: '375x812,1440x900', schemes: 'light,dark', loadChromium: fake.load,
    });

    assert.equal(report.schemaVersion, '1.1');
    assert.equal(report.results.length, 4);
    assert.deepEqual(report.results.map((record) => `${record.viewport.width}-${record.colorScheme}`),
      ['375-light', '1440-light', '375-dark', '1440-dark']);
    assert.deepEqual(fake.calls.contexts[0], {viewport: {width: 375, height: 812}, deviceScaleFactor: 1, reducedMotion: 'reduce', colorScheme: 'light'});
    assert.deepEqual(report.results[0].screenshot, '375x812-light.png');
    assert.equal(fs.existsSync(path.join(out, '375x812-light.png')), true);
    assert.equal(fake.calls.closed, 1);

    assert.equal(report.axeEnabled, false);
    assert.equal(report.axeViolationCount, null);
    assert.ok(report.notChecked.includes('WCAG conformance'), 'without axe, WCAG is explicitly not checked');
    assert.match(report.recommendation, /install axe-core to enable rule checks/);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(out, 'audit.json'), 'utf8')), report);
  });
});

test('axe runs when the project installed it, and its findings are summarised', async () => {
  await withProject(async (project) => {
    installFakeAxe(project);
    const fake = makeFakeChromium({
      axeResult: {
        testEngine: {version: '4.9.1'},
        violations: [{
          id: 'color-contrast', impact: 'serious', help: 'Elements must have sufficient contrast',
          helpUrl: 'https://example.org/contrast', tags: ['cat.color', 'wcag2aa', 'wcag143'],
          nodes: [{target: ['.a']}, {target: ['.b']}, {target: ['.c']}, {target: ['.d']}],
        }],
      },
    });
    const {report} = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', axe: true, loadChromium: fake.load});

    assert.equal(report.axeEnabled, true);
    assert.equal(report.axeViolationCount, 1);
    const [violation] = report.results[0].axe.violations;
    assert.equal(report.results[0].axe.engine, '4.9.1');
    assert.deepEqual(violation.wcag, ['wcag2aa', 'wcag143'], 'only wcag tags are kept');
    assert.equal(violation.nodes, 4);
    assert.deepEqual(violation.sample, ['.a', '.b', '.c'], 'at most three examples');
    assert.ok(report.automatedChecks.includes('axe-core rule violations'));
    assert.equal(report.notChecked.includes('WCAG conformance'), false);
    assert.match(report.recommendation, /axe-core covers only part of WCAG/);
    assert.equal(fake.calls.scripts.length, 1, 'the bundle is injected once per page');
  });
});

test('axe asked for but not installed stops the run before the browser opens', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium();
    await assert.rejects(
      () => auditURL({project, url: URL_LOCAL, axe: true, loadChromium: fake.load}),
      /axe-core is not installed/,
    );
    assert.equal(fake.calls.launches.length, 0);
  });
});

test('a failing axe injection is recorded without losing the rest of the run', async () => {
  await withProject(async (project) => {
    installFakeAxe(project);
    const fake = makeFakeChromium({addScriptTagError: new Error('CSP blocked the script')});
    const {report} = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', axe: true, loadChromium: fake.load});
    assert.deepEqual(report.results[0].axe, {engine: null, violations: [], error: 'CSP blocked the script'});
    assert.equal(report.axeViolationCount, 0);
    assert.ok(report.results[0].diagnostics, 'the page was still measured');
  });
});

test('a page that will not load is recorded rather than thrown', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium({gotoError: new Error('net::ERR_CONNECTION_REFUSED')});
    const {report} = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', loadChromium: fake.load});
    assert.equal(report.results[0].navigationError, 'net::ERR_CONNECTION_REFUSED');
    assert.equal(report.results[0].screenshot, null, 'no screenshot means untested, and the report says so');
    assert.equal(report.results[0].diagnostics, null);
    assert.equal(report.results[0].axe, null);
  });
});

test('console and uncaught page errors are collected, and capped', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium({
      consoleErrors: Array.from({length: 40}, (unused, index) => `console ${index}`),
    });
    const {report} = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', loadChromium: fake.load});
    assert.equal(report.results[0].consoleErrors.length, 30, 'the list is capped');
    assert.equal(report.results[0].consoleErrors[0], 'console 0');

    const withPageError = makeFakeChromium({consoleErrors: ['from console'], pageErrors: ['Uncaught TypeError']});
    const second = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', loadChromium: withPageError.load});
    assert.deepEqual(second.report.results[0].consoleErrors, ['from console', 'Uncaught TypeError'],
      'an uncaught page error is collected alongside console output');
  });
});

test('the report lands where the caller asks, or in the project workspace', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium();
    const chosen = path.join(project, 'reports', 'run-1');
    const explicit = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', output: chosen, loadChromium: fake.load});
    assert.equal(explicit.out, chosen);

    const automatic = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', loadChromium: fake.load});
    assert.equal(automatic.out.startsWith(path.join(project, '.zanker', 'reports')), true);
    assert.match(path.basename(automatic.out), /^127-0-0-1-\d+$/, 'the host and the run time name the directory');
  });
});

test('reaching a remote page, or auditing without Playwright, is refused', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium();
    await assert.rejects(() => auditURL({project, url: 'https://example.com', loadChromium: fake.load}), /requires --allow-remote/);
    const remote = await auditURL({project, url: 'https://example.com', allowRemote: true, viewports: '375x812', schemes: 'light', loadChromium: fake.load});
    assert.equal(remote.report.url, 'https://example.com');
    await assert.rejects(() => auditURL({project, url: URL_LOCAL, loadChromium: async () => null}), /Playwright is not installed/);
  });
});

test('the page probe reports overflow, unlabelled controls and broken images', () => {
  const image = (attributes) => ({
    hasAttribute: (name) => name in attributes,
    complete: attributes.complete ?? true,
    naturalWidth: attributes.naturalWidth ?? 10,
  });
  const button = (attributes) => ({
    textContent: attributes.text ?? '',
    getAttribute: (name) => attributes[name] ?? null,
  });
  const dom = {
    innerWidth: 390,
    innerHeight: 844,
    document: {
      title: 'Painel',
      documentElement: {scrollWidth: 500, lang: 'pt-BR'},
      querySelectorAll: (selector) => (selector === 'img'
        ? [image({alt: ''}), image({}), image({alt: '', complete: false}), image({alt: '', naturalWidth: 0})]
        : [button({}), button({text: '  '}), button({text: 'Salvar'}), button({'aria-label': 'Fechar'}), button({'aria-labelledby': 'x'})]),
    },
  };

  const result = withStubDocument(dom, collectPageDiagnostics);
  assert.equal(result.title, 'Painel');
  assert.deepEqual(result.viewport, {width: 390, height: 844});
  assert.equal(result.pageWidth, 500);
  assert.equal(result.hasHorizontalOverflow, true);
  assert.equal(result.imagesWithoutAlt, 1);
  assert.equal(result.brokenImages, 2, 'an incomplete image and one with no natural width both count');
  assert.equal(result.emptyButtonsWithoutAccessibleName, 2, 'a label or a labelledby is an accessible name');
  assert.equal(result.documentLang, 'pt-BR');
});

test('the page probe reports a page with nothing wrong', () => {
  const dom = {
    innerWidth: 1440,
    innerHeight: 900,
    document: {
      title: '',
      documentElement: {scrollWidth: 1440, lang: ''},
      querySelectorAll: () => [],
    },
  };
  const result = withStubDocument(dom, collectPageDiagnostics);
  assert.equal(result.hasHorizontalOverflow, false);
  assert.equal(result.documentLang, null, 'a missing lang is null rather than an empty string');
  assert.equal(result.imagesWithoutAlt, 0);
  assert.equal(result.emptyButtonsWithoutAccessibleName, 0);
});

test('the axe summary survives a result missing its optional fields', async () => {
  await withProject(async (project) => {
    installFakeAxe(project);
    const fake = makeFakeChromium({axeResult: {violations: [{id: 'label', nodes: [{target: ['input']}]}]}});
    const {report} = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', axe: true, loadChromium: fake.load});
    assert.equal(report.results[0].axe.engine, null, 'an unreported engine version is null');
    assert.deepEqual(report.results[0].axe.violations[0].wcag, [], 'a violation with no tags carries none');

    const empty = makeFakeChromium({axeResult: {}});
    const second = await auditURL({project, url: URL_LOCAL, viewports: '375x812', schemes: 'light', axe: true, loadChromium: empty.load});
    assert.deepEqual(second.report.results[0].axe.violations, []);
    assert.equal(second.report.axeViolationCount, 0);
  });
});

test('the browser probes run against a stub page', async () => {
  const {runAxeInPage, waitForFontsReady} = await import('../src/audit.mjs');

  const ready = Promise.resolve('loaded');
  assert.equal(withStubDocument({document: {fonts: {ready}}}, waitForFontsReady), ready);
  assert.equal(withStubDocument({document: {}}, waitForFontsReady), undefined,
    'a browser without the font loading API is not an error');

  const saved = globalThis.window;
  const calls = [];
  globalThis.window = {axe: {run: (document_, options) => { calls.push(options); return {violations: []}; }}};
  try {
    assert.deepEqual(await withStubDocument({document: {}}, runAxeInPage), {violations: []});
    assert.deepEqual(calls, [{resultTypes: ['violations']}], 'only violations are requested, not passes');
  } finally {
    globalThis.window = saved;
  }
});
