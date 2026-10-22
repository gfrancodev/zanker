import fs from 'node:fs';
import path from 'node:path';
import {parseSafeHttpUrl, resolveOptionalDependency, toSafeSlug, writeJsonFile} from './common.mjs';
import {resolveChromium} from './browser.mjs';

/**
 * Screenshots a page across viewports and color schemes, and records what was
 * checked automatically.
 *
 * The report is deliberately explicit about its own limits. axe-core covers part
 * of WCAG and never all of it, a screenshot proves rendering and not taste, and
 * a staging URL is not production. Every report carries those caveats next to
 * the results, so a passing run cannot be read as more than it is.
 */

/** Schema of the report this module writes. */
const SCHEMA_VERSION = '1.1';

/** Viewports used when the caller names none: phone, tablet, desktop. */
const DEFAULT_VIEWPORTS = '375x812,768x1024,1440x900';

/** Bounds on what a viewport argument may ask for. */
const VIEWPORT_LIMITS = Object.freeze({min: 240, max: 4000, count: 12});

/** Color schemes a page can be rendered in. */
const COLOR_SCHEMES = Object.freeze(['light', 'dark']);

/** Motion preferences a context can simulate. Reduced is the default, as the safer check. */
const MOTION_PREFERENCES = Object.freeze(['reduce', 'no-preference']);

/** Navigation budget before a page is considered unreachable. */
const NAVIGATION_TIMEOUT_MS = 25000;

/** Console errors kept per run, enough to see a pattern without filling the report. */
const MAX_CONSOLE_ERRORS = 30;

/** Example selectors kept per axe violation. */
const MAX_AXE_SAMPLES = 3;

/** What a run of this tool does establish. */
const AUTOMATED_CHECKS = Object.freeze([
  'viewport overflow', 'console errors', 'images without alt',
  'broken images', 'unnamed icon-only buttons', 'light and dark color schemes',
]);

/** What it does not, stated so a passing report is not over read. */
const NOT_CHECKED = Object.freeze([
  'visual aesthetics', 'functional business logic',
  'Core Web Vitals field metrics', 'true production parity',
]);

/**
 * Parses the viewport argument.
 *
 * @param {string} [value] Comma separated `WIDTHxHEIGHT` pairs.
 * @returns {{width: number, height: number}[]}
 * @throws {Error} When a pair is malformed, outside safe limits, or there are too many.
 */
export function validateViewports(value) {
  const sizes = String(value || DEFAULT_VIEWPORTS).split(',').map((part) => {
    const match = part.match(/^(\d{2,4})x(\d{2,4})$/);
    if (!match) throw new Error(`Invalid viewport ${part}`);
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (width < VIEWPORT_LIMITS.min || height < VIEWPORT_LIMITS.min || width > VIEWPORT_LIMITS.max || height > VIEWPORT_LIMITS.max) {
      throw new Error('Viewport outside safe limits');
    }
    return {width, height};
  });
  if (sizes.length > VIEWPORT_LIMITS.count) throw new Error(`Maximum ${VIEWPORT_LIMITS.count} viewports`);
  return sizes;
}

/**
 * @param {string} [value] Comma separated scheme names.
 * @returns {string[]} The requested schemes, without duplicates.
 * @throws {Error} When a scheme is unknown or the list is empty.
 */
export function validateSchemes(value) {
  const requested = String(value || COLOR_SCHEMES.join(',')).split(',').map((scheme) => scheme.trim()).filter(Boolean);
  for (const scheme of requested) {
    if (!COLOR_SCHEMES.includes(scheme)) throw new Error(`Invalid color scheme ${scheme}; use light and/or dark`);
  }
  if (!requested.length) throw new Error('At least one color scheme required');
  return [...new Set(requested)];
}

/**
 * @param {string} [value] Motion preference to simulate.
 * @returns {string} The preference, defaulting to reduced motion.
 * @throws {Error} When the preference is unknown.
 */
export function validateMotion(value) {
  const preference = String(value || MOTION_PREFERENCES[0]);
  if (!MOTION_PREFERENCES.includes(preference)) throw new Error('Motion must be reduce or no-preference');
  return preference;
}

/**
 * Reads axe-core's browser bundle from wherever the user installed it.
 *
 * @param {string[]} searchRoots Directories whose `package.json` anchors the lookup.
 * @returns {string|null} The bundle source, or null when axe-core is absent.
 */
function readAxeSource(searchRoots) {
  const entry = resolveOptionalDependency('axe-core/axe.min.js', searchRoots);
  if (!entry) return null;
  return fs.readFileSync(entry, 'utf8');
}

/**
 * Serialised into the page and run there, so it may not close over anything in
 * this module. Exported so the probe can be exercised against a stub document
 * without launching a browser. These are the defects worth catching without judgement: content
 * wider than the viewport, images that never loaded or carry no alternative
 * text, and controls a screen reader would announce as nothing at all.
 *
 * @returns {object} What the page reports about itself.
 */
export function collectPageDiagnostics() {
  const root = document.documentElement;
  const images = [...document.querySelectorAll('img')];
  const unnamedButtons = [...document.querySelectorAll('button')].filter(
    (button) => !button.textContent?.trim() && !button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby'),
  ).length;
  return {
    title: document.title,
    viewport: {width: innerWidth, height: innerHeight},
    pageWidth: root.scrollWidth,
    hasHorizontalOverflow: root.scrollWidth > innerWidth + 2,
    imagesWithoutAlt: images.filter((image) => !image.hasAttribute('alt')).length,
    emptyButtonsWithoutAccessibleName: unnamedButtons,
    brokenImages: images.filter((image) => !image.complete || image.naturalWidth === 0).length,
    documentLang: root.lang || null,
  };
}

/**
 * Serialised into the page. Waits for web fonts so a screenshot is not taken
 * mid swap, which would make every text comparison noisy. Exported so it can be
 * exercised without a browser.
 *
 * @returns {Promise<unknown>|undefined} Resolves once fonts settle, or nothing
 *   in a browser with no font loading API.
 */
export function waitForFontsReady() {
  return document.fonts?.ready;
}

/**
 * Serialised into the page. Runs axe and returns only the violations.
 * Exported so it can be exercised without a browser.
 *
 * @returns {Promise<object>} The raw axe result.
 */
export async function runAxeInPage() {
  return window.axe.run(document, {resultTypes: ['violations']});
}

/**
 * Reduces an axe result to what belongs in a report.
 *
 * @param {object} raw The object axe returned.
 * @returns {object} Engine version and one entry per violation.
 */
function summariseAxeResult(raw) {
  return {
    engine: raw.testEngine?.version || null,
    violations: (raw.violations || []).map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      helpUrl: violation.helpUrl,
      wcag: (violation.tags || []).filter((tag) => /^wcag/.test(tag)),
      nodes: violation.nodes.length,
      sample: violation.nodes.slice(0, MAX_AXE_SAMPLES).map((node) => node.target.join(' ')),
    })),
  };
}

/**
 * Captures one page in one viewport and one color scheme.
 *
 * A navigation failure is recorded rather than thrown: one unreachable
 * combination should not discard the evidence gathered for the others.
 *
 * @param {object} options
 * @param {object} options.browser A launched Playwright browser.
 * @param {string} options.url Page to open.
 * @param {{width: number, height: number}} options.viewport
 * @param {string} options.colorScheme
 * @param {string} options.reducedMotion
 * @param {string} options.outputDirectory Where the screenshot is written.
 * @param {string|null} options.axeSource axe-core bundle, when it is installed.
 * @returns {Promise<object>} One record for the report.
 */
async function captureOne({browser, url, viewport, colorScheme, reducedMotion, outputDirectory, axeSource}) {
  const context = await browser.newContext({viewport, deviceScaleFactor: 1, reducedMotion, colorScheme});
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const screenshot = `${viewport.width}x${viewport.height}-${colorScheme}.png`;
  let navigationError = null;
  try {
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS});
    await page.evaluate(waitForFontsReady);
    await page.screenshot({path: path.join(outputDirectory, screenshot), fullPage: true, animations: 'disabled'});
  } catch (error) {
    navigationError = error.message;
  }

  let diagnostics = null;
  let axe = null;
  if (!navigationError) {
    diagnostics = await page.evaluate(collectPageDiagnostics);
    if (axeSource) {
      try {
        await page.addScriptTag({content: axeSource});
        axe = summariseAxeResult(await page.evaluate(runAxeInPage));
      } catch (error) {
        axe = {engine: null, violations: [], error: error.message};
      }
    }
  }

  await context.close();
  return {
    viewport, colorScheme, reducedMotion,
    screenshot: navigationError ? null : screenshot,
    navigationError, consoleErrors: consoleErrors.slice(0, MAX_CONSOLE_ERRORS), diagnostics, axe,
  };
}

/**
 * @param {boolean} axeEnabled Whether axe-core ran.
 * @returns {string} What the reader should do with this report.
 */
function recommendationFor(axeEnabled) {
  return axeEnabled
    ? 'axe-core covers only part of WCAG. Review each screenshot in both schemes with an AI critic and a human, and validate keyboard navigation manually.'
    : 'Review each screenshot with an AI critic and a human, validate keyboard navigation manually, and install axe-core to enable rule checks (--axe).';
}

/**
 * Screenshots a page across every requested viewport and color scheme.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project.
 * @param {string} options.url Page to audit.
 * @param {string} [options.viewports] Comma separated `WIDTHxHEIGHT` pairs.
 * @param {string} [options.output] Directory for the report. Defaults inside `.zanker/reports/`.
 * @param {boolean} [options.allowRemote] Permit a non loopback URL.
 * @param {boolean} [options.axe] Run axe-core, which must be installed in the project.
 * @param {string} [options.schemes] Comma separated color schemes.
 * @param {string} [options.motion] Motion preference to simulate.
 * @param {(searchRoots: string[]) => Promise<object|null>} [options.loadChromium] Seam for tests.
 * @returns {Promise<{report: object, out: string}>}
 * @throws {Error} When the URL is not permitted, Playwright is missing, or axe
 *   was requested but is not installed.
 */
export async function auditURL({
  project, url, viewports, output, allowRemote = false, axe = false,
  schemes, motion, loadChromium = resolveChromium,
}) {
  parseSafeHttpUrl(url, allowRemote);

  const searchRoots = [project, process.cwd()];
  const chromium = await loadChromium(searchRoots);
  if (!chromium) {
    throw new Error('Playwright is not installed. In your project: npm install -D playwright && npx playwright install chromium');
  }

  const sizes = validateViewports(viewports);
  const schemeList = validateSchemes(schemes);
  const reducedMotion = validateMotion(motion);
  const axeSource = axe ? readAxeSource(searchRoots) : null;
  if (axe && !axeSource) throw new Error('axe-core is not installed. In your project: npm install -D axe-core');

  const outputDirectory = path.resolve(
    output || path.join(project, '.zanker', 'reports', toSafeSlug(new URL(url).hostname + '-' + Date.now())),
  );
  fs.mkdirSync(outputDirectory, {recursive: true});

  const browser = await chromium.launch({headless: true});
  const results = [];
  try {
    for (const colorScheme of schemeList) {
      for (const viewport of sizes) {
        results.push(await captureOne({browser, url, viewport, colorScheme, reducedMotion, outputDirectory, axeSource}));
      }
    }
  } finally {
    await browser.close();
  }

  const automatedChecks = axeSource ? [...AUTOMATED_CHECKS, 'axe-core rule violations'] : [...AUTOMATED_CHECKS];
  const notChecked = axeSource ? [...NOT_CHECKED] : ['WCAG conformance', ...NOT_CHECKED];
  const report = {
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    url,
    colorSchemes: schemeList,
    reducedMotion,
    axeEnabled: Boolean(axeSource),
    axeViolationCount: axeSource ? results.reduce((total, record) => total + (record.axe?.violations?.length || 0), 0) : null,
    results,
    automatedChecks,
    notChecked,
    recommendation: recommendationFor(Boolean(axeSource)),
  };

  writeJsonFile(path.join(outputDirectory, 'audit.json'), report);
  return {report, out: outputDirectory};
}

/**
 * Lightweight accessibility outline for page-graph enrichment (roles and headings).
 *
 * @param {object} options
 * @param {string} options.url Local URL to open.
 * @param {boolean} [options.allowRemote]
 * @returns {Promise<object>}
 */
export async function captureAccessibilityOutline({url, allowRemote = false}) {
  parseSafeHttpUrl(url, allowRemote);
  const browserType = await resolveChromium();
  if (!browserType) {
    return {ok: false, reason: 'playwright-missing', outline: []};
  }
  const browser = await browserType.launch({headless: true});
  try {
    const page = await browser.newPage();
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS});
    const outline = await page.evaluate(() => {
      const nodes = [];
      const selectors = 'header, nav, main, footer, aside, h1, h2, h3, [role]';
      for (const el of document.querySelectorAll(selectors)) {
        const role = el.getAttribute('role') || el.tagName.toLowerCase();
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 80);
        nodes.push({role, name});
        if (nodes.length >= 80) break;
      }
      return nodes;
    });
    return {ok: true, url, outline};
  } finally {
    await browser.close();
  }
}
