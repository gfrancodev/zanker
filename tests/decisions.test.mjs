import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {listDecisions, recordDecision} from '../src/decisions.mjs';

function withProject(body) {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-decisions-'));
  try {
    return body(project);
  } finally {
    fs.rmSync(project, {recursive: true, force: true});
  }
}

test('a decision is written into the project workspace and read back', () => {
  withProject((project) => {
    const record = recordDecision({project, title: 'Keep the existing scale', decision: 'Reuse the spacing tokens'});
    assert.match(record.id, /^[0-9a-f-]{36}$/);
    assert.match(record.at, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(record.status, 'proposed');
    assert.equal(record.approvedBy, null, 'nothing is approved by default');
    assert.match(record.source, /not proof of real user consent/);
    assert.deepEqual(listDecisions(project), [record]);
    assert.equal(fs.existsSync(path.join(project, '.zanker', 'decisions.jsonl')), true);
  });
});

test('records append rather than replace', () => {
  withProject((project) => {
    recordDecision({project, title: 'First', decision: 'one'});
    recordDecision({project, title: 'Second', decision: 'two', status: 'rejected'});
    const all = listDecisions(project);
    assert.deepEqual(all.map((record) => record.title), ['First', 'Second']);
    assert.equal(all[1].status, 'rejected');
  });
});

test('an approval must name the human who gave it', () => {
  withProject((project) => {
    assert.throws(
      () => recordDecision({project, title: 'Ship it', decision: 'go', status: 'approved'}),
      /agent cannot self-approve/,
    );
    assert.throws(
      () => recordDecision({project, title: 'Ship it', decision: 'go', status: 'approved', approvedBy: '   '}),
      /agent cannot self-approve/,
    );
    const approved = recordDecision({project, title: 'Ship it', decision: 'go', status: 'approved', approvedBy: 'Gustavo'});
    assert.equal(approved.approvedBy, 'Gustavo');
  });
});

test('an incomplete or unknown decision is refused', () => {
  withProject((project) => {
    for (const bad of [{title: '  ', decision: 'x'}, {title: 'x', decision: ''}, {title: undefined, decision: 'x'}]) {
      assert.throws(() => recordDecision({project, ...bad}), /title and body are required/);
    }
    assert.throws(() => recordDecision({project, title: 'x', decision: 'y', status: 'maybe'}), /Invalid status/);
  });
});

test('oversized fields are truncated instead of rejected', () => {
  withProject((project) => {
    const record = recordDecision({
      project, title: 'T'.repeat(500), decision: 'D'.repeat(9000),
      evidence: Array.from({length: 50}, (unused, index) => `shot-${index}.png`),
    });
    assert.equal(record.title.length, 200);
    assert.equal(record.decision.length, 6000);
    assert.equal(record.evidence.length, 30);
  });
});

test('a project with no log reads as empty rather than failing', () => {
  withProject((project) => {
    assert.deepEqual(listDecisions(project), []);
    assert.deepEqual(listDecisions(path.join(project, 'never-created')), []);
  });
});
