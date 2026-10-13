import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {resolveChromium} from '../src/browser.mjs';

function withProject(body) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-browser-'));
  fs.writeFileSync(path.join(project, 'package.json'), '{"name":"fixture"}');
  try {
    return body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

/** Installs a stand in for playwright so resolution can be tested without the real one. */
function installFakePlaywright(project, body) {
  const moduleDirectory = path.join(project, 'node_modules', 'playwright');
  fs.mkdirSync(moduleDirectory, {recursive: true});
  fs.writeFileSync(path.join(moduleDirectory, 'package.json'), '{"name":"playwright","version":"0.0.0","type":"module","main":"index.mjs"}');
  fs.writeFileSync(path.join(moduleDirectory, 'index.mjs'), body);
}

test('Playwright is loaded from the project that installed it', async () => {
  await withProject(async (project) => {
    installFakePlaywright(project, 'export const chromium = {marker: "named"};\n');
    assert.deepEqual(await resolveChromium([project]), {marker: 'named'});
  });
});

test('a default export carrying chromium is accepted too', async () => {
  await withProject(async (project) => {
    installFakePlaywright(project, 'export default {chromium: {marker: "default"}};\n');
    assert.deepEqual(await resolveChromium([project]), {marker: 'default'});
  });
});

test('a Playwright build without Chromium reports nothing rather than a broken object', async () => {
  await withProject(async (project) => {
    installFakePlaywright(project, 'export const firefox = {};\nexport default {};\n');
    assert.equal(await resolveChromium([project]), null);
  });
});

test('a project without Playwright resolves to nothing, and the search falls through', async () => {
  await withProject(async (project) => {
    assert.equal(await resolveChromium([project]), null);
    assert.equal(await resolveChromium([]), null);
    installFakePlaywright(project, 'export const chromium = {marker: "second"};\n');
    assert.deepEqual(await resolveChromium([path.join(project, 'absent'), project]), {marker: 'second'});
  });
});
