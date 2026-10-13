import {pathToFileURL} from 'node:url';
import {resolveOptionalDependency} from './common.mjs';

/**
 * The one place that reaches for Playwright.
 *
 * The plugin never bundles a browser. It uses the one the user installed in
 * their own project, which keeps the plugin small and means the browser version
 * is theirs to control. Callers decide what to say when it is missing, because
 * the advice differs between an audit and a forensic diagnosis.
 */

/**
 * Loads Playwright's Chromium API from the first search root that has it.
 *
 * @param {string[]} searchRoots Directories whose `package.json` anchors the lookup, in order.
 * @returns {Promise<object|null>} The Chromium API, or null when Playwright is
 *   not installed or exposes no Chromium entry point.
 */
export async function resolveChromium(searchRoots) {
  const entry = resolveOptionalDependency('playwright', searchRoots);
  if (!entry) return null;
  const playwright = await import(pathToFileURL(entry).href);
  return playwright.chromium || playwright.default?.chromium || null;
}
