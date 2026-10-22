import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PLUGIN_ROOT} from '../src/common.mjs';
import {loadMotionCatalog, searchMotionTechniques} from '../src/motion-catalog.mjs';

const bridge = path.join(PLUGIN_ROOT, 'scripts/bridge.mjs');

test('motion-search overshoot button returns overshoot with css or component surface', () => {
  const results = searchMotionTechniques('overshoot button');
  assert.ok(results.length > 0);
  assert.equal(results[0].id, 'overshoot');
  assert.ok(
    results[0].surfaces.includes('css') || results[0].surfaces.includes('component'),
    JSON.stringify(results[0].surfaces),
  );
});

test('motion-search unknown query returns empty techniques list', () => {
  assert.deepEqual(searchMotionTechniques('quantum tunnelling widget'), []);
});

test('motion catalog includes MIT attribution and direction contract', () => {
  const catalog = loadMotionCatalog();
  assert.equal(catalog.attribution.license, 'MIT');
  assert.ok(catalog.directionContract.rules.length >= 3);
  assert.ok(catalog.designMeter.genericSignals.length >= 3);
  assert.equal(catalog.techniques.length, 15);
});

test('motion-search bridge action returns contract and meter', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-motion-'));
  try {
    const r = spawnSync(process.execPath, [bridge, 'motion-search', '--project', project, '--query', 'microinteraction hover'], {
      encoding: 'utf8',
    });
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    assert.equal(out.ok, true);
    assert.ok(out.results.length > 0);
    assert.ok(out.directionContract?.rules?.length);
    assert.ok(out.designMeter?.uiChecks?.length);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
});

test('motion-design skill cites contract, design meter and no default Remotion', () => {
  const skill = fs.readFileSync(path.join(PLUGIN_ROOT, 'skills/zanker-motion-design/SKILL.md'), 'utf8');
  assert.match(skill, /motion-search\.sh/);
  assert.match(skill, /direction contract/i);
  assert.match(skill, /design meter/i);
  assert.match(skill, /Do not install Remotion/i);
});
