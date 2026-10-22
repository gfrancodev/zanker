import fs from 'node:fs';
import path from 'node:path';
import {collectFiles, pathExists, readJsonFile, toPosixPath, writeJsonFile} from './common.mjs';
import {buildPageGraph} from './page-graph.mjs';

/**
 * Reads an unfamiliar frontend repository and reports what it is built from.
 *
 * Everything here is a heuristic over files and `package.json`. Nothing is
 * executed, no script is run, and no dependency is installed, because the point
 * is to understand a repository safely before touching it. What a scan cannot
 * know is stated in the manifest rather than left for the reader to assume.
 */

/** File types worth reading during a scan. */
const TEXT_FILE = /\.(css|scss|sass|less|tsx|jsx|vue|svelte|html|json|ts|js|mjs)$/;

/** Stylesheets, in any of the four dialects a project may use. */
const STYLESHEET = /\.(css|scss|sass|less)$/;

/** Files that can define a component. */
const COMPONENT_FILE = /\.(jsx|tsx|vue|svelte)$/;

/** Stylesheets worth reading for custom properties. */
const TOKEN_SOURCE = /\.(css|scss)$/;

/** A CSS custom property declaration. */
const CSS_CUSTOM_PROPERTY = /--([a-z0-9][a-z0-9-]*)\s*:/gi;

/** Stylesheets loaded application wide rather than beside one component. */
const GLOBAL_STYLESHEET = /(^|\/)(index|global|globals|styles?|main|app)\.(css|scss|sass)$/;

/** Dependencies worth reporting back, as opposed to the whole tree. */
const NOTABLE_DEPENDENCY = /^(react|react-dom|vite|next|vue|nuxt|svelte|@angular\/|tailwindcss|sass|@playwright\/|playwright|storybook|@storybook\/)/;

/** Basename fragments that suggest a file holds a shared component. */
const COMPONENT_KEYWORDS = Object.freeze([
  'button', 'input', 'modal', 'dialog', 'card', 'navbar',
  'sidebar', 'table', 'form', 'layout', 'theme', 'provider',
]);

/** Files that look like they provide context rather than render a screen. */
const PROVIDER_NAME = /(provider|theme)/i;

/** Caps that keep a scan of an unfamiliar repository bounded. */
const LIMITS = Object.freeze({
  files: 7000, depth: 7, styleFiles: 100, globalStyles: 20, componentFiles: 250,
  componentCandidates: 90, tokenFiles: 180, tokens: 200, tokenFileBytes: 250_000,
});

/**
 * Frameworks, in the order they are reported. Order matters: Next is reported
 * before React because a Next project is also a React project, and the first
 * entry is the more specific answer.
 *
 * @type {readonly {name: string, detect: (context: {hasDependency: (name: string) => boolean, projectRoot: string}) => boolean}[]}
 */
const FRAMEWORK_SIGNALS = Object.freeze([
  {name: 'nextjs', detect: ({hasDependency}) => hasDependency('next')},
  {name: 'angular', detect: ({hasDependency, projectRoot}) => hasDependency('@angular/core') || pathExists(path.join(projectRoot, 'angular.json'))},
  {name: 'react', detect: ({hasDependency}) => hasDependency('react')},
  {name: 'vue', detect: ({hasDependency}) => hasDependency('vue')},
  {name: 'nuxt', detect: ({hasDependency}) => hasDependency('nuxt')},
  {name: 'svelte', detect: ({hasDependency}) => hasDependency('svelte') || hasDependency('@sveltejs/kit')},
  {name: 'vite', detect: ({hasDependency}) => hasDependency('vite')},
]);

/** Styling approaches, each identified by the package that provides it. */
const STYLING_SIGNALS = Object.freeze([
  ['tailwindcss', 'tailwind'],
  ['sass', 'sass'],
  ['styled-components', 'styled-components'],
  ['@emotion/react', 'emotion'],
  ['@mui/material', 'mui'],
  ['@chakra-ui/react', 'chakra'],
  ['@radix-ui/react-dialog', 'radix'],
  ['antd', 'ant-design'],
  ['shadcn-ui', 'shadcn'],
]);

/** What a file scan cannot establish, stated so a reader does not assume it did. */
const SCAN_LIMITS = Object.freeze([
  'Heuristic repository scan; never executes project scripts',
  'Computed styles, runtime providers and imported fonts require a browser check',
  'Product audiences and user needs cannot be inferred reliably from code',
]);

/**
 * @param {string} projectRoot Absolute project root.
 * @returns {object} The parsed `package.json`, or an empty object when there is none.
 */
function readPackageManifest(projectRoot) {
  const manifestPath = path.join(projectRoot, 'package.json');
  return pathExists(manifestPath) ? readJsonFile(manifestPath) : {};
}

/**
 * @param {object} context Passed to each signal.
 * @param {string[]} files Every text file found, used for the fallback.
 * @returns {string[]} Framework names, most specific first.
 */
function detectFrameworks(context, files) {
  const detected = FRAMEWORK_SIGNALS.filter((signal) => signal.detect(context)).map((signal) => signal.name);
  if (detected.length) return detected;
  // A folder of plain HTML is still a frontend, and the sandbox can render it.
  return files.some((file) => file.endsWith('.html')) ? ['html'] : [];
}

/**
 * @param {(name: string) => boolean} hasDependency
 * @param {string[]} stylePaths Project-relative stylesheet paths.
 * @returns {string[]} Styling approaches, without duplicates.
 */
function detectStyling(hasDependency, stylePaths) {
  const detected = STYLING_SIGNALS.filter(([packageName]) => hasDependency(packageName)).map(([, label]) => label);
  if (stylePaths.some((file) => file.endsWith('.module.css'))) detected.push('css-modules');
  return [...new Set(detected)];
}

/**
 * Collects CSS custom property names declared anywhere in the project.
 *
 * Oversized and unreadable files are skipped rather than failing the scan: a
 * partial token list is useful, a crashed scan is not.
 *
 * @param {string[]} files Every text file found.
 * @returns {string[]} Property names, sorted.
 */
function collectDesignTokens(files) {
  const tokens = new Set();
  for (const file of files.filter((candidate) => TOKEN_SOURCE.test(candidate)).slice(0, LIMITS.tokenFiles)) {
    let body;
    try {
      if (fs.statSync(file).size > LIMITS.tokenFileBytes) continue;
      body = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const match of body.matchAll(CSS_CUSTOM_PROPERTY)) {
      tokens.add('--' + match[1]);
      if (tokens.size >= LIMITS.tokens) break;
    }
  }
  return [...tokens].sort();
}

/**
 * @typedef {object} ProjectManifest
 * @property {string} schemaVersion
 * @property {string} scannedAt ISO timestamp of the scan.
 * @property {string} project Absolute project root.
 * @property {string} packageName Name from `package.json`, or the directory name.
 * @property {string[]} frameworks Detected frameworks, most specific first.
 * @property {Record<string,string>} dependencies The notable ones, with versions.
 * @property {Record<string,string>} scripts The project's npm scripts.
 * @property {string[]} styling Detected styling approaches.
 * @property {string[]} globalStyles Stylesheets that look application wide.
 * @property {string[]} styleFiles Every stylesheet found.
 * @property {string[]} componentCandidates Files whose names suggest shared components.
 * @property {number} sourceFiles How many component files were found.
 * @property {string[]} designTokens CSS custom properties declared anywhere.
 * @property {string[]} providers Candidates that look like context providers.
 * @property {string[]} limits What this scan cannot establish.
 */

/**
 * Scans a project and reports what it is built from.
 *
 * @param {string} project Absolute path of the project.
 * @param {boolean} [save] Write the result to `.zanker/project.manifest.json`.
 * @returns {ProjectManifest}
 * @throws {Error} When the path is not a directory.
 */
export function inspectProject(project, save = true) {
  const projectRoot = path.resolve(project);
  if (!fs.statSync(projectRoot).isDirectory()) throw new Error('Project must be a directory');

  const packageManifest = readPackageManifest(projectRoot);
  const dependencies = {...(packageManifest.dependencies || {}), ...(packageManifest.devDependencies || {})};
  const hasDependency = (name) => Boolean(dependencies[name]);
  const files = collectFiles(projectRoot, {matches: (file) => TEXT_FILE.test(file), maxDepth: LIMITS.depth, maxEntries: LIMITS.files});
  const relative = (file) => toPosixPath(path.relative(projectRoot, file));

  const stylePaths = files.filter((file) => STYLESHEET.test(file)).map(relative).slice(0, LIMITS.styleFiles);
  const componentFiles = files.filter((file) => COMPONENT_FILE.test(file)).map(relative).slice(0, LIMITS.componentFiles);
  const componentCandidates = componentFiles
    .filter((file) => COMPONENT_KEYWORDS.some((keyword) => path.basename(file).toLowerCase().includes(keyword)))
    .slice(0, LIMITS.componentCandidates);

  const manifest = {
    schemaVersion: '1.0',
    scannedAt: new Date().toISOString(),
    project: projectRoot,
    packageName: packageManifest.name || path.basename(projectRoot),
    frameworks: detectFrameworks({hasDependency, projectRoot}, files),
    dependencies: Object.fromEntries(Object.entries(dependencies).filter(([name]) => NOTABLE_DEPENDENCY.test(name))),
    scripts: packageManifest.scripts || {},
    styling: detectStyling(hasDependency, stylePaths),
    globalStyles: stylePaths.filter((file) => GLOBAL_STYLESHEET.test(file)).slice(0, LIMITS.globalStyles),
    styleFiles: stylePaths,
    componentCandidates,
    sourceFiles: componentFiles.length,
    designTokens: collectDesignTokens(files),
    providers: componentCandidates.filter((file) => PROVIDER_NAME.test(file)),
    limits: SCAN_LIMITS,
  };

  if (save) {
    writeJsonFile(path.join(projectRoot, '.zanker', 'project.manifest.json'), manifest);
    writeJsonFile(path.join(projectRoot, '.zanker', 'page-graph.json'), buildPageGraph(projectRoot, manifest.frameworks));
  }
  return manifest;
}
