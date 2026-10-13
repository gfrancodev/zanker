import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PLUGIN_ROOT, readJsonFile} from '../src/common.mjs';

/**
 * Guards what a user receives when they install this plugin.
 *
 * The marketplace entry sets `source: "."`, so the plugin root is the repository
 * root and Claude Code copies the whole tracked tree into its plugin cache.
 * There is no ignore file, allowlist or `files` key for a plugin, so the tracked
 * tree is the install, byte for byte. Every check here exists because nothing
 * else stands between a file landing in the repository and that same file
 * landing on every user's disk.
 */

/** Top-level entries allowed to reach a user. A new one is a deliberate decision, not a default. */
const ALLOWED_TOP_LEVEL = Object.freeze([
  '.claude-plugin/', '.cursor-plugin/', '.github/', '.gitignore',
  'AGENT.md', 'AGENTS.md', 'CHANGELOG.md', 'CODE_OF_CONDUCT.md', 'CONTRIBUTING.md',
  'LICENSE', 'README.md', 'SECURITY.md',
  'adapters/', 'agents/', 'assets/', 'commands/', 'docs/',
  'knowledge/', 'package.json', 'plugin.json', 'rules/', 'schemas/', 'scripts/',
  'skills/', 'src/', 'templates/', 'tests/',
]);

/**
 * Paths Claude Code treats as a component location. None of them is used here, so
 * any of them appearing means the plugin silently started loading something new.
 * `bin/` carries a second penalty: claude.ai and Cowork refuse to install a
 * plugin that has one, so adding it would cut those hosts off entirely.
 */
const UNUSED_COMPONENT_PATHS = Object.freeze([
  'bin', 'hooks', 'output-styles', 'workflows', 'themes', 'monitors',
  '.mcp.json', '.lsp.json', 'settings.json', 'CLAUDE.md',
]);

/** Directories the scripts write at runtime. Tracking one would ship a user's working state. */
const RUNTIME_DIRECTORIES = Object.freeze(['node_modules/', '.zanker/', '.mcpb-cache/']);

/** An install this size is already generous for text, prompts and one icon. */
const INSTALL_SIZE_CEILING_BYTES = 2 * 1024 * 1024;

/**
 * Every file the install carries, as git reports it. A fresh clone holds exactly
 * these paths, so this is the shipped set rather than whatever sits untracked on
 * a maintainer's disk.
 *
 * @returns {string[]} Repository-relative paths, or an empty list outside a checkout.
 */
function trackedFiles() {
  const listing = spawnSync('git', ['ls-files', '-z'], {cwd: PLUGIN_ROOT, encoding: 'utf8'});
  if (listing.status !== 0) return [];
  return listing.stdout.split('\0').filter(Boolean);
}

/**
 * @param {string[]} files Repository-relative paths.
 * @returns {string[]} Sorted top-level entries, directories marked with a trailing slash.
 */
function topLevelEntries(files) {
  const entries = new Set();
  for (const file of files) {
    const [head, ...rest] = file.split('/');
    entries.add(rest.length > 0 ? `${head}/` : head);
  }
  return [...entries].sort();
}

/** @returns {string} Every tracked text file joined, for reference lookups. */
function trackedProse(files) {
  const readable = /\.(md|mdc|json|mjs|sh|ps1|html|css|jsx?|tsx?)$/;
  return files
    .filter((file) => readable.test(file))
    .map((file) => fs.readFileSync(path.join(PLUGIN_ROOT, file), 'utf8'))
    .join('\n');
}

test('the install surface holds only entries that were decided on', () => {
  const files = trackedFiles();
  if (files.length === 0) return;
  assert.deepEqual(
    topLevelEntries(files),
    [...ALLOWED_TOP_LEVEL].sort(),
    'the plugin root is the install root, so a new top-level entry reaches every user. '
      + 'Add it to ALLOWED_TOP_LEVEL once you have decided it belongs in an install.',
  );
});

test('no component location is in use that the plugin never declared', () => {
  for (const relativePath of UNUSED_COMPONENT_PATHS) {
    assert.equal(
      fs.existsSync(path.join(PLUGIN_ROOT, relativePath)),
      false,
      `${relativePath} exists. Claude Code loads it on sight, and this plugin never declared it.`,
    );
  }
});

test('the default scan finds exactly one agent and one command, and no more', () => {
  for (const [directory, expected] of [['agents', ['zanker.md']], ['commands', ['zanker.md']]]) {
    assert.deepEqual(
      fs.readdirSync(path.join(PLUGIN_ROOT, directory)).sort(),
      expected,
      `${directory}/ is scanned whole, so anything dropped in there loads into every session.`,
    );
  }
});

/**
 * Measured against Claude Code 2.1.296: a component key whose value is a file
 * path replaces the default scan and then loads nothing. `agents: "./agents/zanker.md"`
 * and the array form both report `Agents (0)`, with no error, no warning, and
 * `claude plugin validate --strict` still passing. A directory value such as
 * `commands: ["./commands/"]` does work, and `agents` accepts only files, so
 * `agents` has no working form at all. The default scan is the only reliable path.
 */
test('no component key silently replaces the scan with nothing', () => {
  const manifest = readJsonFile(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'));
  for (const key of ['agents', 'commands']) {
    const declared = manifest[key];
    if (declared === undefined) continue;
    const entries = Array.isArray(declared) ? declared : [declared];
    const files = entries.filter((entry) => !entry.endsWith('/'));
    assert.deepEqual(
      files,
      [],
      `"${key}" names a file. That turns off the default scan and loads nothing, so the agent or `
        + 'command disappears while every check still passes. Remove the key, or name a directory.',
    );
  }
});

test('the directories the scripts write at runtime can never be committed into an install', () => {
  const ignored = fs.readFileSync(path.join(PLUGIN_ROOT, '.gitignore'), 'utf8').split('\n');
  for (const directory of RUNTIME_DIRECTORIES) {
    assert.ok(ignored.includes(directory), `.gitignore does not cover ${directory}`);
  }
});

test('every shipped asset is referenced by something', () => {
  const files = trackedFiles();
  if (files.length === 0) return;
  const prose = trackedProse(files);
  const orphans = files
    .filter((file) => file.startsWith('assets/'))
    .filter((file) => !prose.includes(path.basename(file)));
  assert.deepEqual(
    orphans,
    [],
    'an asset nothing points at is pure install weight. Reference it or delete it.',
  );
});

test('the install stays under its size ceiling', () => {
  const files = trackedFiles();
  if (files.length === 0) return;
  const bytes = files.reduce((total, file) => total + fs.statSync(path.join(PLUGIN_ROOT, file)).size, 0);
  assert.ok(
    bytes <= INSTALL_SIZE_CEILING_BYTES,
    `the install grew to ${(bytes / 1024 / 1024).toFixed(2)} MB, past the `
      + `${INSTALL_SIZE_CEILING_BYTES / 1024 / 1024} MB ceiling. Text and prompts do not weigh this much, `
      + 'so look for a binary that slipped in.',
  );
});
