import fs from 'node:fs';
import path from 'node:path';
import {collectFiles, toPosixPath} from './common.mjs';

const LANDMARK = /\b(header|nav|main|footer|section|form|table|aside)\b/gi;
const IMPORT = /import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"](\.\.?\/[^'"]+)['"]/g;

const ROUTE_PATTERNS = [
  {framework: 'nextjs', globs: ['app/**/page.{tsx,jsx,ts,js}', 'pages/**/*.{tsx,jsx,ts,js}']},
  {framework: 'nuxt', globs: ['pages/**/*.{vue,tsx,jsx}']},
  {framework: 'svelte', globs: ['src/routes/**/+page.svelte', 'src/routes/**/+layout.svelte']},
  {framework: 'angular', globs: ['src/app/**/*.component.ts', 'src/app/**/pages/**/*.{ts,html}']},
  {framework: 'html', globs: ['**/*.html']},
];

const MAX_PAGES = 80;
const MAX_FILE_BYTES = 120_000;

/**
 * @param {string} projectRoot
 * @param {string[]} frameworks
 * @returns {string[]} Project-relative route file paths.
 */
function discoverRouteFiles(projectRoot, frameworks) {
  const primary = frameworks[0] || 'html';
  const patterns = ROUTE_PATTERNS.filter((p) => p.framework === primary || (primary === 'react' && p.framework === 'nextjs'));
  const chosen = patterns.length ? patterns : ROUTE_PATTERNS.filter((p) => p.framework === 'html');
  const files = collectFiles(projectRoot, {
    matches: (file) => /\.(tsx|jsx|vue|svelte|html|ts)$/.test(file),
    maxDepth: 8,
    maxEntries: 5000,
  });
  const relative = files.map((f) => toPosixPath(path.relative(projectRoot, f)));
  const hits = new Set();
  for (const pattern of chosen) {
    for (const glob of pattern.globs) {
      const suffix = glob.replace('**/', '').replace(/\{[^}]+\}/g, '');
      for (const file of relative) {
        if (glob.includes('app/**/page') && /(^|\/)app\/(.+\/)?page\.(tsx|jsx|ts|js)$/.test(file)) hits.add(file);
        else if (glob.startsWith('pages/') && file.startsWith('pages/')) hits.add(file);
        else if (file.includes('src/routes/') && file.endsWith('+page.svelte')) hits.add(file);
        else if (file.includes('src/app/') && (file.endsWith('.component.ts') || file.endsWith('.html'))) hits.add(file);
        else if (pattern.framework === 'html' && file.endsWith('.html') && !file.includes('node_modules')) hits.add(file);
      }
    }
  }
  return [...hits].sort().slice(0, MAX_PAGES);
}

/**
 * @param {string} projectRoot
 * @param {string} relativePath
 * @returns {{landmarks: string[], imports: string[]}}
 */
function parseRouteFile(projectRoot, relativePath) {
  const abs = path.join(projectRoot, relativePath);
  let body = '';
  try {
    if (fs.statSync(abs).size > MAX_FILE_BYTES) return {landmarks: [], imports: []};
    body = fs.readFileSync(abs, 'utf8');
  } catch {
    return {landmarks: [], imports: []};
  }
  const landmarks = [];
  for (const match of body.matchAll(LANDMARK)) {
    const tag = match[1].toLowerCase();
    if (!landmarks.includes(tag)) landmarks.push(tag);
  }
  const imports = [];
  for (const match of body.matchAll(IMPORT)) {
    imports.push(match[1]);
    if (imports.length >= 40) break;
  }
  return {landmarks, imports};
}

/**
 * @param {string} projectRoot
 * @param {string[]} frameworks
 * @returns {object}
 */
export function buildPageGraph(projectRoot, frameworks) {
  const pages = discoverRouteFiles(projectRoot, frameworks).map((routePath) => {
    const {landmarks, imports} = parseRouteFile(projectRoot, routePath);
    return {path: routePath, landmarks, componentImports: imports};
  });
  return {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    pages,
    limits: [
      'Static scan only; dynamic routes and runtime-only sections are not inferred',
      'Use audit with Playwright for rendered accessibility roles when a local URL is available',
    ],
  };
}
