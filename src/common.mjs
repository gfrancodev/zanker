import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

/**
 * Helpers every other module in `src/` builds on: paths, small filesystem
 * operations, text escaping, command line parsing and the two security checks
 * that keep the optional tools local and contained.
 *
 * Nothing here knows about Zanker's domain. A function that only one module
 * needs belongs in that module, not in this one.
 */

/** Directories never worth walking into when scanning a project. */
const IGNORED_DIRECTORY_NAMES = new Set([
  'node_modules', '.git', '.next', '.nuxt', '.angular', 'dist', 'build',
  'coverage', '.cache', '.turbo', '.zanker', '.storybook-cache', 'vendor', '.venv',
]);

/** Hosts that resolve to the local machine, and the only ones a server may bind to. */
const LOOPBACK_HOSTS = Object.freeze(['127.0.0.1', 'localhost', '::1']);

/** Hostnames accepted without the explicit remote opt in. */
const LOOPBACK_URL_HOSTNAMES = Object.freeze(['localhost', '127.0.0.1', '[::1]']);

/** Characters that change meaning inside HTML, and their entities. */
const HTML_ENTITIES = Object.freeze({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
});

/**
 * Absolute path of the installed plugin, derived from this file's own location
 * so it stays correct wherever a harness unpacks the plugin.
 */
export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {string} filePath Absolute path of a JSON file.
 * @returns {any} The parsed contents.
 * @throws {Error} When the file is missing or is not valid JSON.
 */
export function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * @param {string} targetPath Path to test.
 * @returns {boolean} True when something exists at that path.
 */
export function pathExists(targetPath) {
  return fs.existsSync(targetPath);
}

/**
 * Writes pretty printed JSON, creating parent directories as needed.
 *
 * @param {string} filePath Absolute path to write.
 * @param {any} data Value to serialise.
 * @returns {void}
 */
export function writeJsonFile(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Reduces arbitrary text to a short filesystem-safe name.
 *
 * @param {unknown} value Text to reduce, of any type.
 * @returns {string} Lowercase name of at most 72 characters, or `unnamed` when
 *   nothing usable survives.
 */
export function toSafeSlug(value) {
  const slug = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
  return slug || 'unnamed';
}

/**
 * Escapes the five characters that change meaning inside HTML.
 *
 * @param {unknown} value Text to escape. Null and undefined become an empty string.
 * @returns {string} Text safe to interpolate into markup as content or an attribute.
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ENTITIES[character]);
}

/**
 * @returns {string} A 160 bit random hex token, used to gate the local preview servers.
 */
export function createSessionToken() {
  return crypto.randomBytes(20).toString('hex');
}

/**
 * Resolves a path and refuses to leave the directory it is resolved against.
 *
 * Every path that reaches the filesystem from a command line argument passes
 * through here, which is what stops `--out ../../etc/anything` from writing
 * outside the project the user named.
 *
 * @param {string} baseDirectory Directory the result must stay inside.
 * @param {string} relativePath Path to resolve, usually from user input.
 * @returns {string} The absolute resolved path.
 * @throws {Error} When the result would escape the base directory.
 */
export function resolveWithin(baseDirectory, relativePath) {
  const base = path.resolve(baseDirectory);
  const resolved = path.resolve(base, relativePath);
  if (resolved === base || resolved.startsWith(base + path.sep)) return resolved;
  throw new Error(`Path outside project: ${relativePath}`);
}

/**
 * @param {string} value A path using this platform's separator.
 * @returns {string} The same path with forward slashes, so reports read the same everywhere.
 */
export function toPosixPath(value) {
  return value.split(path.sep).join('/');
}

/**
 * Walks a directory tree and returns the files a predicate accepts.
 *
 * Bounded on purpose: a scan of an unfamiliar repository must not hang on a deep
 * tree or exhaust memory on a huge one. Symbolic links are skipped rather than
 * followed, so a link pointing outward cannot pull the scan out of the project.
 * An unreadable directory is skipped rather than fatal, because a partial scan of
 * someone's repository is more useful than no scan.
 *
 * @param {string} rootDirectory Directory to walk.
 * @param {object} options
 * @param {(filePath: string) => boolean} options.matches Predicate deciding what to keep.
 * @param {number} [options.maxDepth] How deep to descend.
 * @param {number} [options.maxEntries] How many matches to collect before stopping.
 * @returns {string[]} Absolute paths of the matching files.
 */
export function collectFiles(rootDirectory, {matches, maxDepth = 7, maxEntries = 6000}) {
  const found = [];

  const walk = (directory, depth) => {
    if (depth > maxDepth || found.length >= maxEntries) return;
    let entries;
    try {
      entries = fs.readdirSync(directory, {withFileTypes: true});
    } catch {
      return;
    }
    for (const entry of entries) {
      if (found.length >= maxEntries) return;
      if (entry.isSymbolicLink()) continue;
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORY_NAMES.has(entry.name)) walk(entryPath, depth + 1);
        continue;
      }
      if (entry.isFile() && matches(entryPath)) found.push(entryPath);
    }
  };

  walk(rootDirectory, 0);
  return found;
}

/**
 * Parses the long options the shell wrappers pass through.
 *
 * `--flag value` becomes `{flag: 'value'}`, a trailing or doubled `--flag`
 * becomes `{flag: true}`, `--no-flag` becomes `{flag: false}`, and anything not
 * starting with two dashes lands in `_` in order.
 *
 * @param {string[]} argv Arguments after the subcommand.
 * @returns {{_: string[]} & Record<string, string|boolean>}
 */
export function parseCommandLineOptions(argv) {
  const options = {_: []};
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (!argument.startsWith('--')) {
      options._.push(argument);
      continue;
    }
    const key = argument.slice(2);
    if (key.startsWith('no-')) {
      options[key.slice(3)] = false;
      continue;
    }
    const next = argv[index + 1];
    if (next !== undefined && !next.startsWith('--')) {
      options[key] = next;
      index++;
      continue;
    }
    options[key] = true;
  }
  return options;
}

/**
 * Refuses any bind address that would expose a local preview beyond this machine.
 *
 * @param {string} host Address a server is about to bind to.
 * @returns {void}
 * @throws {Error} When the address is not loopback.
 */
export function assertLoopback(host) {
  if (LOOPBACK_HOSTS.includes(host)) return;
  throw new Error('Server is limited to loopback addresses');
}

/**
 * Parses a URL the tools are allowed to open.
 *
 * Reaching a remote host sends a real request from the user's machine, so it is
 * opt in rather than the default.
 *
 * @param {string} value URL to check.
 * @param {boolean} [allowRemote] Whether a non loopback host is permitted.
 * @returns {URL} The parsed URL.
 * @throws {Error} When the URL is malformed, is not HTTP, or is remote without the opt in.
 */
export function parseSafeHttpUrl(value, allowRemote = false) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP(S) URLs permitted');
  if (allowRemote || LOOPBACK_URL_HOSTNAMES.includes(url.hostname)) return url;
  throw new Error('Remote URL requires --allow-remote');
}

/**
 * Resolves an optional dependency from the user's project rather than from the
 * plugin, which has none of its own.
 *
 * Playwright, axe-core and sharp are heavy and not everyone needs them, so the
 * plugin never bundles them. It looks them up where the user installed them and
 * lets the caller explain how to add one when it is missing.
 *
 * @param {string} specifier Package to resolve, for example `playwright`.
 * @param {string[]} searchRoots Directories whose `package.json` anchors the lookup, in order.
 * @returns {string|null} Absolute path of the resolved entry point, or null when
 *   the package is not installed anywhere in the search roots.
 */
export function resolveOptionalDependency(specifier, searchRoots) {
  for (const root of searchRoots) {
    try {
      return createRequire(path.join(root, 'package.json')).resolve(specifier);
    } catch {
      continue;
    }
  }
  return null;
}
