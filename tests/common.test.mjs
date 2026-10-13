import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import {
  PLUGIN_ROOT, assertLoopback, collectFiles, createSessionToken, escapeHtml, parseCommandLineOptions,
  parseSafeHttpUrl, pathExists, readJsonFile, resolveWithin, toPosixPath, toSafeSlug, writeJsonFile,
} from '../src/common.mjs';

function withTempDirectory(body) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-common-'));
  try {
    return body(directory);
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
}

test('the plugin root is the directory holding the plugin manifest', () => {
  assert.equal(pathExists(path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json')), true);
  assert.equal(pathExists(path.join(PLUGIN_ROOT, 'does-not-exist')), false);
});

test('JSON round trips through the filesystem, and bad JSON fails loudly', () => {
  withTempDirectory((directory) => {
    const target = path.join(directory, 'nested', 'deeper', 'data.json');
    writeJsonFile(target, {name: 'zanker', packs: [1, 2]});
    assert.deepEqual(readJsonFile(target), {name: 'zanker', packs: [1, 2]});
    assert.equal(fs.readFileSync(target, 'utf8').endsWith('\n'), true, 'files end with a newline');

    fs.writeFileSync(path.join(directory, 'broken.json'), '{not json');
    assert.throws(() => readJsonFile(path.join(directory, 'broken.json')));
    assert.throws(() => readJsonFile(path.join(directory, 'absent.json')), /ENOENT/);
  });
});

test('a slug is lowercase, bounded, and never empty', () => {
  assert.equal(toSafeSlug('Olá Mundo!!'), 'ol-mundo');
  assert.equal(toSafeSlug('--- trimmed ---'), 'trimmed');
  assert.equal(toSafeSlug('a'.repeat(90)).length, 72, 'a slug is capped');
  assert.equal(toSafeSlug(''), 'unnamed');
  assert.equal(toSafeSlug('!!!'), 'unnamed', 'nothing usable still yields a name');
  assert.equal(toSafeSlug(42), '42', 'any type is accepted');
});

test('every character that changes meaning in HTML is escaped', () => {
  assert.equal(escapeHtml(`<a href="x">&'`), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
  assert.equal(escapeHtml(7), '7');
});

test('a session token is 160 bits of hex and never repeats', () => {
  const first = createSessionToken();
  assert.match(first, /^[0-9a-f]{40}$/);
  assert.notEqual(first, createSessionToken());
});

test('resolving a path refuses to leave the directory it is resolved against', () => {
  withTempDirectory((directory) => {
    assert.equal(resolveWithin(directory, 'a/b.txt'), path.join(directory, 'a', 'b.txt'));
    assert.equal(resolveWithin(directory, '.'), path.resolve(directory), 'the base itself is inside itself');
    assert.throws(() => resolveWithin(directory, '../escape'), /Path outside project: \.\.\/escape/);
    assert.throws(() => resolveWithin(directory, '/etc/passwd'), /Path outside project/);
    assert.throws(() => resolveWithin(directory, `${directory}-sibling/file`), /Path outside project/,
      'a sibling sharing the prefix is still outside');
  });
});

test('paths are reported with forward slashes on every platform', () => {
  assert.equal(toPosixPath(path.join('a', 'b', 'c')), 'a/b/c');
});

test('a file scan keeps matches, and skips what it must not follow', () => {
  withTempDirectory((directory) => {
    const write = (relative) => {
      const target = path.join(directory, relative);
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, 'x');
      return target;
    };
    write('a.css');
    write('src/b.css');
    write('src/ignored.txt');
    write('node_modules/pkg/c.css');
    fs.symlinkSync(path.join(directory, 'a.css'), path.join(directory, 'link.css'));

    const found = collectFiles(directory, {matches: (file) => file.endsWith('.css')});
    const names = found.map((file) => path.relative(directory, file)).sort();
    assert.deepEqual(names, ['a.css', path.join('src', 'b.css')].sort());
    assert.equal(names.includes('link.css'), false, 'symlinks are skipped, not followed');
    assert.equal(found.some((file) => file.includes('node_modules')), false, 'ignored directories are not entered');
  });
});

test('a file scan stops at its depth and count limits', () => {
  withTempDirectory((directory) => {
    const deep = path.join(directory, 'one', 'two', 'three');
    fs.mkdirSync(deep, {recursive: true});
    fs.writeFileSync(path.join(deep, 'deep.css'), 'x');
    fs.writeFileSync(path.join(directory, 'shallow.css'), 'x');
    assert.deepEqual(
      collectFiles(directory, {matches: (file) => file.endsWith('.css'), maxDepth: 1}).map((file) => path.basename(file)),
      ['shallow.css'],
      'nothing below the depth limit is reached',
    );

    for (let index = 0; index < 12; index++) fs.writeFileSync(path.join(directory, `f${index}.css`), 'x');
    assert.equal(collectFiles(directory, {matches: () => true, maxEntries: 3}).length, 3);
    assert.equal(
      collectFiles(directory, {matches: () => true, maxEntries: 1, maxDepth: 4}).length, 1,
      'the limit also stops the walk before it descends again',
    );
  });
});

test('a directory the scan cannot read is skipped rather than fatal', () => {
  withTempDirectory((directory) => {
    assert.deepEqual(collectFiles(path.join(directory, 'absent'), {matches: () => true}), []);
  });
});

test('a scan walks past an entry that is neither file nor directory', () => {
  withTempDirectory((directory) => {
    const socketPath = path.join(directory, 'live.sock');
    fs.writeFileSync(path.join(directory, 'real.css'), 'x');
    const server = net.createServer();
    try {
      server.listen(socketPath);
    } catch {
      return; // platforms without unix sockets have nothing to assert here
    }
    try {
      const found = collectFiles(directory, {matches: () => true});
      assert.deepEqual(found.map((file) => path.basename(file)), ['real.css'], 'the socket is not collected');
    } finally {
      server.close();
    }
  });
});

test('command line options cover values, bare flags, negation and positionals', () => {
  assert.deepEqual(parseCommandLineOptions(['--url', 'http://x', '--axe']), {_: [], url: 'http://x', axe: true});
  assert.deepEqual(parseCommandLineOptions(['--axe', '--url', 'http://x']), {_: [], axe: true, url: 'http://x'},
    'a flag followed by another flag takes no value');
  assert.deepEqual(parseCommandLineOptions(['--no-save']), {_: [], save: false});
  assert.deepEqual(parseCommandLineOptions(['build', 'now', '--force']), {_: ['build', 'now'], force: true});
  assert.deepEqual(parseCommandLineOptions([]), {_: []});
});

test('a server may bind only to this machine', () => {
  for (const host of ['127.0.0.1', 'localhost', '::1']) assert.doesNotThrow(() => assertLoopback(host));
  assert.throws(() => assertLoopback('0.0.0.0'), /limited to loopback/);
  assert.throws(() => assertLoopback('192.168.0.10'), /limited to loopback/);
});

test('reaching a remote host is opt in, and only over HTTP', () => {
  assert.equal(parseSafeHttpUrl('http://127.0.0.1:3000/page').hostname, '127.0.0.1');
  assert.equal(parseSafeHttpUrl('http://localhost:5173/').port, '5173');
  assert.throws(() => parseSafeHttpUrl('https://example.com'), /requires --allow-remote/);
  assert.equal(parseSafeHttpUrl('https://example.com', true).hostname, 'example.com');
  assert.throws(() => parseSafeHttpUrl('ftp://example.com', true), /Only HTTP\(S\) URLs permitted/);
  assert.throws(() => parseSafeHttpUrl('file:///etc/passwd', true), /Only HTTP\(S\) URLs permitted/);
  assert.throws(() => parseSafeHttpUrl('not a url'), /Invalid URL/);
});

test('an optional dependency is looked up in the project, not in the plugin', async () => {
  const {resolveOptionalDependency} = await import('../src/common.mjs');
  withTempDirectory((directory) => {
    fs.writeFileSync(path.join(directory, 'package.json'), '{"name":"fixture"}');
    assert.equal(resolveOptionalDependency('a-package-nobody-has', [directory]), null);
    assert.equal(resolveOptionalDependency('a-package-nobody-has', []), null, 'no search roots means not found');
    const resolved = resolveOptionalDependency('node:path', [directory]);
    assert.equal(resolved, 'node:path', 'a built in resolves from any root');
    assert.equal(
      resolveOptionalDependency('node:path', [path.join(directory, 'absent'), directory]),
      'node:path',
      'a root that does not resolve falls through to the next',
    );
  });
});
