import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PLUGIN_ROOT} from '../src/common.mjs';
import {runDesignSearch, findDisallowedDesignSearchFlags} from '../src/design-search.mjs';
import {searchReferenceSites} from '../src/reference-sites.mjs';
import {searchComponents, listComponentNames} from '../src/component-catalog.mjs';
import {inspectProject} from '../src/inspect.mjs';

const bridge = path.join(PLUGIN_ROOT, 'scripts/bridge.mjs');

test('design-search rejects disallowed flags', () => {
  assert.deepEqual(findDisallowedDesignSearchFlags({project: '/tmp', persist: true, domain: 'style'}), ['persist', 'domain']);
});

test('fintech banking design-system returns JSON keys when python3 is available', () => {
  const py = spawnSync('python3', ['--version']);
  if (py.status !== 0) return;
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-ds-'));
  try {
    const result = runDesignSearch({
      project,
      options: {query: 'fintech banking', 'design-system': true, json: true, p: 'TestApp'},
    });
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.ok(result.json?.design_system?.style);
    assert.ok(result.json?.design_system?.colors);
    assert.ok(fs.existsSync(path.join(project, '.zanker', 'design-intelligence', 'testapp.md')));
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
});

test('reference-search returns at most three sites with URLs', () => {
  const results = searchReferenceSites('fintech mobile onboarding');
  assert.ok(results.length <= 3);
  assert.ok(results.length > 0);
  for (const site of results) assert.ok(site.url.startsWith('https://'));
  assert.deepEqual(searchReferenceSites('quantum tunnelling widget'), []);
});

test('component-search finds Date Picker with Calendar dependency', () => {
  const results = searchComponents('date picker');
  assert.equal(results[0].name, 'Date Picker');
  assert.ok(results[0].dependencies.includes('Calendar'));
  assert.equal(listComponentNames().length, 66);
  assert.deepEqual(searchComponents('not-a-real-component'), []);
});

test('inspect writes page-graph with landmarks in order', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-pg-'));
  try {
    const page = path.join(project, 'app/page.tsx');
    fs.mkdirSync(path.dirname(page), {recursive: true});
    fs.writeFileSync(
      path.join(project, 'package.json'),
      JSON.stringify({name: 'pg', dependencies: {next: '14', react: '18'}}),
    );
    fs.writeFileSync(
      page,
      `import { Card } from '../components/Card';
export default function Page() {
  return (<header><nav /></header><main><section><Card /></section></main>);
}`,
    );
    inspectProject(project);
    const graph = JSON.parse(fs.readFileSync(path.join(project, '.zanker/page-graph.json'), 'utf8'));
    const entry = graph.pages.find((p) => p.path.includes('app/page'));
    assert.ok(entry);
    assert.deepEqual(entry.landmarks.slice(0, 3), ['header', 'nav', 'main']);
    assert.ok(entry.componentImports.some((i) => i.includes('Card')));
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
});

test('art-direction skill forbids studio when reference image is present', () => {
  const skill = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/zanker-art-direction/SKILL.md'), 'utf8');
  assert.match(skill, /Do not open Studio/i);
  assert.match(skill, /reference image/i);
});

test('reference-search bridge action', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-br-'));
  try {
    const r = spawnSync(process.execPath, [bridge, 'reference-search', '--project', project, '--query', 'saas landing'], {encoding: 'utf8'});
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.ok, true);
    assert.ok(out.results.length > 0);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
});
