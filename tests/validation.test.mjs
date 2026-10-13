import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {listSkills, validateSkills} from '../src/skills.mjs';
import {validateKnowledge} from '../src/knowledge.mjs';
import {validateAll} from '../src/validation.mjs';

// Skills, knowledge packs and the whole-plugin validator, against a fixture
// plugin root. Every malformed case here is one the real plugin never has,
// which is exactly why it needs a fixture to be reachable.

const SCHEMA_FILES = [
  'schemas/knowledge.schema.json', 'schemas/project.schema.json', 'schemas/scenario.schema.json',
  'schemas/concept.schema.json', 'schemas/design-review.schema.json',
];

const validRule = (id) => ({
  id, title: `Rule ${id}`, principles: ['Something concrete'],
  sources: [{title: 'Spec', url: 'https://example.org/spec'}],
});

function makeFixture({breakSchema = false, skipManifest = false} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-validate-'));
  const write = (relative, content) => {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  };

  write('skills/alpha/SKILL.md', '---\nname: alpha\ndescription: A valid skill.\n---\n\n<skill name="alpha"></skill>\n');
  if (!skipManifest) write('skills/alpha/manifest.json', {name: 'alpha'});
  write('skills/no-description/SKILL.md', '---\nname: no-description\n---\n\nbody\n');
  write('skills/no-description/manifest.json', {name: 'no-description'});
  write('skills/Bad_Name/SKILL.md', '---\nname: Bad_Name\ndescription: Name is not kebab case.\n---\n\nbody\n');
  write('skills/Bad_Name/manifest.json', {name: 'Bad_Name'});
  write('skills/unterminated/SKILL.md', '---\nname: unterminated\ndescription: Front matter never closes.\n\nbody\n');
  write('skills/unterminated/manifest.json', {name: 'unterminated'});
  write('skills/no-front-matter/SKILL.md', 'name: no-front-matter\ndescription: No fences at all.\n');
  write('skills/no-front-matter/manifest.json', {name: 'no-front-matter'});
  fs.mkdirSync(path.join(root, 'skills', 'empty-directory'), {recursive: true});
  fs.writeFileSync(path.join(root, 'skills', 'loose-file.md'), 'not a skill directory\n');

  write('knowledge/index.json', {schemaVersion: '1.0', packs: []});
  write('knowledge/product/good.json', {
    id: 'good', title: 'Good pack', category: 'product', rules: [validRule('rule-one'), validRule('rule-two')],
  });
  write('knowledge/product/no-title.json', {id: 'no-title', category: 'product', rules: []});
  write('knowledge/product/no-rules.json', {id: 'no-rules', title: 'Has no rules array', category: 'product'});
  write('knowledge/product/broken-rules.json', {
    id: 'broken-rules', title: 'Broken rules', category: 'product',
    rules: [
      {id: 'incomplete', title: 'No principles or sources'},
      {id: 'rule-one', title: 'Duplicates an id from another pack', principles: ['p'], sources: [{url: 'https://example.org'}]},
      {id: 'insecure', title: 'Insecure source', principles: ['p'], sources: [{url: 'http://example.org'}, {title: 'no url'}]},
    ],
  });

  for (const file of SCHEMA_FILES) write(file, {$schema: 'https://json-schema.org/draft/2020-12/schema'});
  if (breakSchema) write('schemas/project.schema.json', '{ not valid json');
  return root;
}

function withFixture(options, body) {
  const root = makeFixture(options);
  try {
    return body(root);
  } finally {
    fs.rmSync(root, {recursive: true, force: true});
  }
}

test('only directories holding a SKILL.md count as skills, and they come back sorted', () => {
  withFixture({}, (root) => {
    const names = listSkills(root).map((skill) => skill.name);
    // localeCompare collates rather than comparing bytes, so case does not lead.
    assert.deepEqual(names, ['alpha', 'Bad_Name', 'no-description', 'no-front-matter', 'unterminated']);
    assert.equal(names.includes('empty-directory'), false, 'a directory without SKILL.md is not a skill');
    assert.equal(names.includes('loose-file.md'), false, 'a loose file is not a skill');
    assert.equal(listSkills(root).find((skill) => skill.name === 'alpha').description, 'A valid skill.');
    assert.equal(listSkills(root).find((skill) => skill.name === 'no-description').description, '');
  });
});

test('every way front matter can be unusable is reported', () => {
  withFixture({}, (root) => {
    const report = validateSkills(root);
    assert.equal(report.count, 5);
    assert.deepEqual(report.errors.sort(), ['Bad_Name', 'no-description', 'no-front-matter', 'unterminated'].sort());
    assert.equal(report.errors.includes('alpha'), false, 'the valid skill is not reported');
  });
});

test('knowledge packs are checked for shape, completeness, uniqueness and sourcing', () => {
  withFixture({}, (root) => {
    const report = validateKnowledge(root);
    assert.equal(report.packs, 4, 'index.json is not a pack');
    assert.ok(report.errors.includes('Invalid pack knowledge/product/no-title.json'), 'a pack needs a title');
    assert.ok(report.errors.includes('Invalid pack knowledge/product/no-rules.json'), 'a pack needs a rules array');
    assert.ok(report.errors.includes('Incomplete knowledge: broken-rules/incomplete'), 'a rule needs principles and sources');
    assert.ok(report.errors.includes('Duplicate rule: rule-one'), 'two rules cannot share an id');
    assert.ok(report.errors.includes('Invalid source in insecure'), 'a source must be https');
    assert.equal(report.errors.filter((message) => message === 'Invalid source in insecure').length, 2,
      'a source without a url is reported too');
    assert.equal(report.rules, 4, 'rule-one, rule-two, incomplete and insecure, with the duplicate counted once');
  });
});

test('a healthy plugin validates, and the real one does', () => {
  const report = validateAll();
  assert.equal(report.ok, true, `the shipped plugin does not validate: ${report.errors.join(', ')}`);
  assert.ok(report.knowledge.packs > 0 && report.skills.count > 0);
});

test('an unparseable schema is reported with the parser message', () => {
  withFixture({breakSchema: true}, (root) => {
    const report = validateAll(root);
    assert.equal(report.ok, false);
    assert.ok(report.errors.some((message) => message.startsWith('Invalid JSON schema schemas/project.schema.json:')));
  });
});

test('a skill without a manifest is reported', () => {
  withFixture({skipManifest: true}, (root) => {
    assert.ok(validateAll(root).errors.includes('Missing manifest in alpha'));
  });
  withFixture({}, (root) => {
    assert.equal(validateAll(root).errors.includes('Missing manifest in alpha'), false);
  });
});
