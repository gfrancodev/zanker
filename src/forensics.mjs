import fs from 'node:fs';
import path from 'node:path';
import {parseSafeHttpUrl, toSafeSlug, writeJsonFile} from './common.mjs';
import {resolveChromium} from './browser.mjs';

/**
 * Captures what the browser actually computed for one element and its ancestors.
 *
 * This answers "what is the layout doing", never "why". A computed style tells
 * you an element overflows; it cannot tell you which rule or which component
 * caused it. The report says so, so the snapshot is not mistaken for a diagnosis.
 */

/** How far up the tree to walk. Most layout causes sit within a few ancestors. */
const ANCESTOR_DEPTH = 8;

/** Phone sized, because that is where layout breaks first. */
const VIEWPORT = Object.freeze({width: 390, height: 844});

/** Navigation budget before a page is considered unreachable. */
const NAVIGATION_TIMEOUT_MS = 25000;

/** Said in the report itself, so a snapshot is never read as a root cause. */
const INTERPRETATION = 'Computed-style snapshot only; source mapping and root cause still require code inspection and reproduction.';

/**
 * Serialised into the page and run there, so it may not close over anything in
 * this module. Exported so the probe can be exercised against a stub document
 * without launching a browser. It walks up from the element, recording geometry, the styles that
 * decide layout, and whether each node is clipping its own content.
 *
 * @returns {{viewport: {width: number, height: number}, nodes: object[]}}
 */
export function describeElementChain(element) {
  const nodes = [];
  let node = element;
  for (let depth = 0; depth < 8 && node; depth++, node = node.parentElement) {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    nodes.push({
      tag: node.tagName.toLowerCase(),
      id: node.id || null,
      className: typeof node.className === 'string' ? node.className.slice(0, 250) : '',
      rect: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
      styles: {
        display: style.display, position: style.position, overflow: style.overflow,
        overflowX: style.overflowX, flex: style.flex, gridTemplateColumns: style.gridTemplateColumns,
        width: style.width, maxWidth: style.maxWidth, minWidth: style.minWidth,
        padding: style.padding, margin: style.margin, fontFamily: style.fontFamily,
        fontSize: style.fontSize, color: style.color, background: style.backgroundColor,
        transform: style.transform, zIndex: style.zIndex,
      },
      clipped: node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2,
    });
  }
  return {viewport: {width: innerWidth, height: innerHeight}, nodes};
}

/**
 * Opens a page, finds one element, and records what the browser computed for it.
 *
 * @param {object} options
 * @param {string} options.project Absolute path of the project. Evidence is written under it.
 * @param {string} options.url Page to open.
 * @param {string} options.selector CSS selector for the element of interest.
 * @param {boolean} [options.allowRemote] Permit a non loopback URL.
 * @param {(searchRoots: string[]) => Promise<object|null>} [options.loadChromium] Seam for tests.
 * @returns {Promise<object>} The diagnostic, also written to the project workspace.
 * @throws {Error} When the URL is not permitted, Playwright is missing, or the
 *   selector matches nothing.
 */
export async function diagnoseElement({project, url, selector, allowRemote = false, loadChromium = resolveChromium}) {
  parseSafeHttpUrl(url, allowRemote);

  const chromium = await loadChromium([project]);
  if (!chromium) {
    throw new Error('Playwright is required in the target project. npm install -D playwright && npx playwright install chromium');
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({viewport: VIEWPORT, reducedMotion: 'reduce'});
    await page.goto(url, {waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS});

    const element = page.locator(selector).first();
    if (await element.count() === 0) throw new Error(`Selector not found: ${selector}`);
    const diagnostic = await element.evaluate(describeElementChain);

    const outputDirectory = path.join(project, '.zanker', 'forensics', toSafeSlug(selector) + '-' + Date.now());
    fs.mkdirSync(outputDirectory, {recursive: true});
    const evidence = path.join(outputDirectory, 'element.png');
    await element.screenshot({path: evidence});

    const result = {url, selector, diagnostic, evidence, interpretation: INTERPRETATION};
    writeJsonFile(path.join(outputDirectory, 'diagnostic.json'), result);
    return result;
  } finally {
    await browser.close();
  }
}
