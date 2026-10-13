import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {describeElementChain, diagnoseElement} from '../src/forensics.mjs';
import {makeFakeChromium} from './fake-browser.mjs';

// Always awaited, so an async body finishes before the fixture is removed.
async function withProject(body) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-forensics-'));
  try {
    return await body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

const URL_LOCAL = 'http://127.0.0.1:4173/page';

test('a diagnosis records the element chain and says what it does not prove', async () => {
  await withProject(async (project) => {
    const description = {viewport: {width: 390, height: 844}, nodes: [{tag: 'div', clipped: true}]};
    const fake = makeFakeChromium({elementDescription: description});
    const result = await diagnoseElement({project, url: URL_LOCAL, selector: '.card > .title', loadChromium: fake.load});

    assert.equal(result.url, URL_LOCAL);
    assert.equal(result.selector, '.card > .title');
    assert.deepEqual(result.diagnostic, description);
    assert.match(result.interpretation, /root cause still require code inspection/);

    assert.deepEqual(fake.calls.contexts[0], {viewport: {width: 390, height: 844}, reducedMotion: 'reduce'});
    assert.equal(fake.calls.pages[0].url, URL_LOCAL);
    assert.equal(fake.calls.closed, 1, 'the browser is always closed');

    assert.equal(fs.existsSync(result.evidence), true);
    assert.equal(path.basename(result.evidence), 'element.png');
    const written = JSON.parse(fs.readFileSync(path.join(path.dirname(result.evidence), 'diagnostic.json'), 'utf8'));
    assert.deepEqual(written, result);
    assert.match(path.basename(path.dirname(result.evidence)), /^card-title-\d+$/, 'the selector names the directory');
  });
});

test('a selector matching nothing fails, and still closes the browser', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium({elementCount: 0});
    await assert.rejects(
      () => diagnoseElement({project, url: URL_LOCAL, selector: '.ghost', loadChromium: fake.load}),
      /Selector not found: \.ghost/,
    );
    assert.equal(fake.calls.closed, 1);
  });
});

test('a remote page needs the explicit opt in', async () => {
  await withProject(async (project) => {
    const fake = makeFakeChromium();
    await assert.rejects(
      () => diagnoseElement({project, url: 'https://example.com', selector: 'h1', loadChromium: fake.load}),
      /requires --allow-remote/,
    );
    const result = await diagnoseElement({project, url: 'https://example.com', selector: 'h1', allowRemote: true, loadChromium: fake.load});
    assert.equal(result.url, 'https://example.com');
  });
});

test('without Playwright the caller is told how to install it', async () => {
  await withProject(async (project) => {
    await assert.rejects(
      () => diagnoseElement({project, url: URL_LOCAL, selector: 'h1', loadChromium: async () => null}),
      /Playwright is required in the target project/,
    );
  });
});

test('the element probe walks ancestors and reports what clips', () => {
  const style = (overrides = {}) => ({
    display: 'block', position: 'static', overflow: 'visible', overflowX: 'visible', flex: '0 1 auto',
    gridTemplateColumns: 'none', width: '100px', maxWidth: 'none', minWidth: '0px', padding: '0px',
    margin: '0px', fontFamily: 'serif', fontSize: '16px', color: 'rgb(0,0,0)', backgroundColor: 'rgba(0,0,0,0)',
    transform: 'none', zIndex: 'auto', ...overrides,
  });
  const node = (overrides) => ({
    tagName: 'DIV', id: '', className: '', scrollWidth: 100, clientWidth: 100, scrollHeight: 50, clientHeight: 50,
    getBoundingClientRect: () => ({x: 0, y: 0, width: 100, height: 50}), parentElement: null, ...overrides,
  });

  const root = node({tagName: 'BODY', id: 'body'});
  const middle = node({className: {baseVal: 'svg-class'}, scrollHeight: 200, parentElement: root});
  const leaf = node({tagName: 'SPAN', className: 'c'.repeat(400), scrollWidth: 300, parentElement: middle});
  const styles = new Map([[root, style()], [middle, style({overflow: 'hidden'})], [leaf, style({display: 'flex'})]]);

  const saved = {getComputedStyle: globalThis.getComputedStyle, innerWidth: globalThis.innerWidth, innerHeight: globalThis.innerHeight};
  globalThis.getComputedStyle = (element) => styles.get(element);
  globalThis.innerWidth = 390;
  globalThis.innerHeight = 844;
  try {
    const result = describeElementChain(leaf);
    assert.deepEqual(result.viewport, {width: 390, height: 844});
    assert.deepEqual(result.nodes.map((entry) => entry.tag), ['span', 'div', 'body']);
    assert.equal(result.nodes[0].className.length, 250, 'a long class list is truncated');
    assert.equal(result.nodes[0].id, null, 'an empty id is reported as null');
    assert.equal(result.nodes[0].clipped, true, 'horizontal clipping is caught');
    assert.equal(result.nodes[1].className, '', 'a non string className is not reported as one');
    assert.equal(result.nodes[1].clipped, true, 'vertical clipping is caught too');
    assert.equal(result.nodes[2].clipped, false);
    assert.equal(result.nodes[2].id, 'body');
    assert.equal(result.nodes[0].styles.display, 'flex');
  } finally {
    Object.assign(globalThis, saved);
  }
});

test('the element probe stops after eight ancestors', () => {
  const chain = Array.from({length: 20}, (unused, index) => ({
    tagName: 'DIV', id: `n${index}`, className: '', scrollWidth: 10, clientWidth: 10, scrollHeight: 10, clientHeight: 10,
    getBoundingClientRect: () => ({x: 0, y: 0, width: 10, height: 10}), parentElement: null,
  }));
  for (let index = 0; index < chain.length - 1; index++) chain[index].parentElement = chain[index + 1];

  const saved = {getComputedStyle: globalThis.getComputedStyle, innerWidth: globalThis.innerWidth, innerHeight: globalThis.innerHeight};
  globalThis.getComputedStyle = () => ({});
  globalThis.innerWidth = 390;
  globalThis.innerHeight = 844;
  try {
    assert.equal(describeElementChain(chain[0]).nodes.length, 8);
  } finally {
    Object.assign(globalThis, saved);
  }
});
