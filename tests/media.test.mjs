import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createSVG, generateMotionCSS, optimizeImage} from '../src/media.mjs';

// Always awaited, so an async body finishes before the directory is removed.
async function withProject(body) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-media-'));
  fs.writeFileSync(path.join(project, 'package.json'), '{"name":"fixture"}');
  try {
    return await body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

/** Installs a stand in for sharp so the success path is reachable without the real dependency. */
function installFakeSharp(project, calls) {
  const moduleDirectory = path.join(project, 'node_modules', 'sharp');
  fs.mkdirSync(moduleDirectory, {recursive: true});
  fs.writeFileSync(path.join(moduleDirectory, 'package.json'), '{"name":"sharp","version":"0.0.0","main":"index.cjs"}');
  fs.writeFileSync(path.join(moduleDirectory, 'index.cjs'), `
    const fs = require('node:fs');
    const log = ${JSON.stringify(calls)};
    module.exports = function sharp(source) {
      const record = {source, resize: null, format: null};
      const api = {
        resize(options) { record.resize = options; return api; },
        webp() { record.format = 'webp'; return api; },
        png() { record.format = 'png'; return api; },
        async toFile(destination) { record.destination = destination; fs.writeFileSync(destination, 'encoded'); fs.appendFileSync(log, JSON.stringify(record) + '\\n'); },
      };
      return api;
    };
  `);
}

test('each illustration kind draws on the same canvas with an accessible name', async () => {
  await withProject((project) => {
    for (const kind of ['empty', 'abstract', 'chart']) {
      const svg = fs.readFileSync(createSVG({project, out: `art-${kind}.svg`, kind, title: 'Sem dados'}), 'utf8');
      assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 640 440" role="img"/);
      assert.match(svg, /<title>Sem dados<\/title>/);
      assert.match(svg, /aria-label="Sem dados"/);
      assert.equal(svg.endsWith('</svg>\n'), true);
    }
  });
});

test('the accessible name is escaped, so a title cannot inject markup', async () => {
  await withProject((project) => {
    const svg = fs.readFileSync(createSVG({project, title: '<script>&"x"'}), 'utf8');
    assert.doesNotMatch(svg, /<script>/);
    assert.match(svg, /&lt;script&gt;&amp;&quot;x&quot;/);
  });
});

test('an unusable accent or kind is refused before anything is written', async () => {
  await withProject((project) => {
    assert.throws(() => createSVG({project, accent: 'red'}), /Accent must be a 6-digit hex color/);
    assert.throws(() => createSVG({project, accent: '#abc'}), /6-digit hex/);
    assert.throws(() => createSVG({project, kind: 'spiral'}), /Available SVG kinds: empty, abstract, chart/);
    assert.equal(fs.readdirSync(project).filter((name) => name.endsWith('.svg')).length, 0);
  });
});

test('assets are written inside the project, at any depth', async () => {
  await withProject((project) => {
    const svg = createSVG({project, out: 'public/art/empty.svg'});
    assert.equal(svg, path.join(project, 'public', 'art', 'empty.svg'));
    assert.throws(() => createSVG({project, out: '../escape.svg'}), /Path outside project/);
    assert.throws(() => generateMotionCSS({project, out: '../escape.css'}), /Path outside project/);
  });
});

test('motion tokens ship with a reduced-motion block that removes the animation', async () => {
  await withProject((project) => {
    const css = fs.readFileSync(generateMotionCSS({project, out: 'styles/motion.css'}), 'utf8');
    assert.match(css, /--zanker-motion-fast: 120ms/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
    assert.match(css, /\.zanker-enter \{animation:none;\}/, 'reduced motion removes it rather than shortening it');
    assert.equal(path.basename(generateMotionCSS({project})), 'zanker.motion.css');
  });
});

test('optimizing an image checks its inputs before reaching for sharp', async () => {
  await withProject(async (project) => {
    await assert.rejects(() => optimizeImage({project, input: 'absent.png', output: 'out.webp'}), /Input not found/);
    fs.writeFileSync(path.join(project, 'in.png'), 'raw');
    await assert.rejects(() => optimizeImage({project, input: 'in.png', output: 'out.gif', format: 'gif'}), /Unsupported format/);
    await assert.rejects(() => optimizeImage({project, input: 'in.png', output: 'out.webp'}), /Install sharp in your project/);
  });
});

test('optimizing an image uses the project own sharp, resizing without enlarging', async () => {
  await withProject(async (project) => {
    const log = path.join(project, 'sharp-calls.jsonl');
    installFakeSharp(project, log);
    fs.writeFileSync(path.join(project, 'in.png'), 'raw');

    const output = await optimizeImage({project, input: 'in.png', output: 'dist/out.webp'});
    assert.equal(output, path.join(project, 'dist', 'out.webp'));
    assert.equal(fs.readFileSync(output, 'utf8'), 'encoded');

    const [call] = fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.equal(call.source, path.join(project, 'in.png'));
    assert.deepEqual(call.resize, {width: 1400, withoutEnlargement: true});
    assert.equal(call.format, 'webp');

    await optimizeImage({project, input: 'in.png', output: 'dist/small.png', width: '320', format: 'png'});
    const calls = fs.readFileSync(log, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    assert.deepEqual(calls[1].resize, {width: 320, withoutEnlargement: true}, 'a string width is coerced to a number');
    assert.equal(calls[1].format, 'png');
  });
});
