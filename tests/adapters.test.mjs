import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildAdapters, buildPortableAgentsMarkdown, skillIndex} from '../src/adapters.mjs';

// Unit tests for the adapter generator. They run against a fixture plugin root
// rather than the real one, so the failure paths a healthy repository never takes
// are reachable: a missing section, a router with no class, a directory that is
// not a plugin root.

const AGENT_SECTIONS = [
  ['role', 'Role text.'],
  ['why_this_matters', 'Why text.'],
  ['frontend_aesthetics', 'Aesthetics text.'],
  ['existing_system_first', 'Precedence text.'],
  [
    'process',
    [
      'Run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/inspect.sh` against ${CLAUDE_PLUGIN_ROOT}',
      'and `${CURSOR_PLUGIN_ROOT}/scripts/` against ${CURSOR_PLUGIN_ROOT}',
    ].join('\n'),
  ],
  [
    'skill_router',
    [
      'Preamble that points at ${CLAUDE_PLUGIN_ROOT}/skills/ and must not be ported.',
      '',
      '<class name="Build">',
      '<route skill="alpha">first signal</route>',
      '</class>',
    ].join('\n'),
  ],
  ['tooling', 'Tooling text.'],
  ['safety', 'Safety text.'],
  ['honesty', 'Honesty text.'],
  ['output_contract', 'Output text.'],
];

function renderFixtureAgent({description = 'Fixture agent description.', omitSection = null, router = null} = {}) {
  const lines = description === null ? ['---', 'name: zanker', '---', ''] : ['---', 'name: zanker', `description: ${description}`, '---', ''];
  for (const [name, body] of AGENT_SECTIONS) {
    if (name === omitSection) continue;
    const content = name === 'skill_router' && router !== null ? router : body;
    lines.push(`<${name}>`, content, `</${name}>`, '');
  }
  return lines.join('\n');
}

/**
 * Writes a minimal but complete plugin root into a fresh temporary directory.
 * Every option exists to reach one failure path.
 */
function makeFixture({agent = {}, withMarketplace = true, skills = 'default'} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-adapters-'));
  const write = (relative, content) => {
    const target = path.join(root, relative);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, content);
  };

  if (withMarketplace) write('.claude-plugin/marketplace.json', '{"name":"zanker","plugins":[{"source":"."}]}\n');
  write('agents/zanker.md', renderFixtureAgent(agent));
  write('rules/zanker.mdc', '---\ndescription: Fixture rule.\n---\n\n<when>Always.</when>\n');

  if (skills === 'default') {
    write('skills/alpha/SKILL.md', '---\nname: alpha\ndescription: The alpha skill.\n---\n\n<skill name="alpha"></skill>\n');
    write('skills/alpha/manifest.json', '{"name":"alpha","triggers":["first signal"]}\n');
    // No triggers key, so the manifest fallback is exercised.
    write('skills/beta/SKILL.md', '---\nname: beta\ndescription: The beta skill.\n---\n\n<skill name="beta"></skill>\n');
    write('skills/beta/manifest.json', '{"name":"beta"}\n');
    // No front matter at all, so the unparsed branch and the missing field are exercised.
    write('skills/gamma/SKILL.md', '<skill name="gamma"></skill>\n');
    write('skills/gamma/manifest.json', '{"name":"gamma","triggers":[]}\n');
    fs.mkdirSync(path.join(root, 'skills', 'not-a-skill-file'), {recursive: true});
    fs.writeFileSync(path.join(root, 'skills', 'loose.txt'), 'ignored, not a directory\n');
    write('skills/not-a-skill-file/SKILL.md', '---\nname: delta\ndescription: The delta skill.\n---\n');
    write('skills/not-a-skill-file/manifest.json', '{"name":"delta"}\n');
  }
  return root;
}

function removeFixture(root) {
  fs.rmSync(root, {recursive: true, force: true});
}

function withFixture(options, body) {
  const root = makeFixture(options);
  try {
    return body(root);
  } finally {
    removeFixture(root);
  }
}

test('the skill catalog is sorted, reads descriptions and defaults missing triggers', () => {
  withFixture({}, (root) => {
    const skills = skillIndex(root);
    assert.deepEqual(skills.map((skill) => skill.name), ['alpha', 'beta', 'gamma', 'not-a-skill-file']);
    assert.equal(skills[0].description, 'The alpha skill.');
    assert.deepEqual(skills[0].triggers, ['first signal']);
    assert.deepEqual(skills[1].triggers, [], 'a manifest without triggers must default to an empty list');
    assert.equal(skills[2].description, '', 'a skill without front matter has no description');
  });
});

test('AGENTS.md carries every section and no Claude-only path variable', () => {
  withFixture({}, (root) => {
    const markdown = buildPortableAgentsMarkdown(root);
    for (const [name] of AGENT_SECTIONS) assert.match(markdown, new RegExp(`<${name}>`), `missing <${name}>`);
    assert.match(markdown, /<skill_catalog>/);
    assert.match(markdown, /<knowledge>/);
    assert.doesNotMatch(markdown, /\$\{CLAUDE_PLUGIN_ROOT\}/);
    assert.doesNotMatch(markdown, /\$\{CURSOR_PLUGIN_ROOT\}/);
    assert.match(markdown, /Run `bash scripts\/inspect\.sh` against \./, 'both variable forms must be resolved');
    assert.match(markdown, /and `scripts\/` against \./, 'the Cursor variable must be resolved too');
    assert.equal(markdown.endsWith('</knowledge>\n'), true, 'the file ends with exactly one newline');
    assert.doesNotMatch(markdown, /\n{3,}/, 'runs of blank lines are collapsed');
  });
});

test('the portable router drops the preamble and keeps the directives', () => {
  withFixture({}, (root) => {
    const markdown = buildPortableAgentsMarkdown(root);
    assert.doesNotMatch(markdown, /Preamble that points at/, 'the agent preamble is not portable');
    assert.match(markdown, /<class name="Build">/);
    assert.match(markdown, /<route skill="alpha">first signal<\/route>/);
  });
});

test('the catalog lists every skill with the description that selects it', () => {
  withFixture({}, (root) => {
    const markdown = buildPortableAgentsMarkdown(root);
    assert.match(markdown, /All 4 skills, with the description/);
    assert.match(markdown, /<skill name="alpha">The alpha skill\.<\/skill>/);
    assert.match(markdown, /<skill name="gamma"><\/skill>/);
  });
});

test('a router with no class directive fails loudly', () => {
  withFixture({agent: {router: 'Only a preamble, no directives at all.'}}, (root) => {
    assert.throws(() => buildPortableAgentsMarkdown(root), /skill_router has no <class> directive/);
  });
});

test('a missing agent section fails before anything is written', () => {
  withFixture({agent: {omitSection: 'honesty'}}, (root) => {
    assert.throws(() => buildPortableAgentsMarkdown(root), /agents\/zanker\.md has no <honesty> section/);
  });
});

test('an agent with no description fails, since two adapters put it in front matter', () => {
  withFixture({agent: {description: null}}, (root) => {
    assert.throws(() => buildPortableAgentsMarkdown(root), /no description in its front matter/);
  });
});

test('each harness adapter gets the layout that harness reads', () => {
  withFixture({}, (root) => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-out-'));
    try {
      buildAdapters({out: output, pluginRoot: root});
      const read = (relative) => fs.readFileSync(path.join(output, relative), 'utf8');

      const copilot = read('adapters/copilot/.github/agents/zanker.agent.md');
      assert.match(copilot, /^---\nname: zanker\ndescription: Fixture agent description\.\n---\n/);
      assert.match(copilot, /<skills>\nSkills live under/);
      assert.doesNotMatch(copilot, /^# /m, 'the Copilot file has no heading');

      const opencode = read('adapters/opencode/.opencode/agents/zanker.md');
      assert.match(opencode, /^---\ndescription: Fixture agent description\.\nmode: primary\n---\n/);
      assert.match(opencode, /OpenCode reads skills from/);

      const kiro = read('adapters/kiro/.kiro/steering/zanker.md');
      assert.match(kiro, /^---\ninclusion: manual\n---\n/);
      assert.match(kiro, /\n# Zanker: frontend UX\/UI agent\n/, 'the Kiro file carries a heading');
      assert.match(kiro, /<reference>\nKiro also loads/);
      assert.doesNotMatch(kiro, /<skills>/, 'Kiro points at AGENTS.md instead of inlining skills');

      assert.equal(read('adapters/cursor/.cursor/rules/zanker.mdc'), fs.readFileSync(path.join(root, 'rules', 'zanker.mdc'), 'utf8'));
      for (const file of [copilot, opencode, kiro]) {
        assert.match(file, /GENERATED FILE\. Do not edit by hand/);
        assert.doesNotMatch(file, /\$\{CLAUDE_PLUGIN_ROOT\}/, 'none of these harnesses substitutes the Claude variable');
        assert.doesNotMatch(file, /\$\{CURSOR_PLUGIN_ROOT\}/, 'nor the Cursor one');
        assert.match(file, /Run `bash scripts\/inspect\.sh` against \./, 'the section must arrive ported, not raw');
      }
    } finally {
      removeFixture(output);
    }
  });
});

test('a first build reports every file as drifted and creates the directories', () => {
  withFixture({}, (root) => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-out-'));
    try {
      const report = buildAdapters({out: output, pluginRoot: root});
      assert.equal(report.generated.length, 5);
      assert.deepEqual(report.drift, report.generated, 'nothing existed yet, so everything drifted');
      assert.equal(report.inSync, false);
      assert.equal(report.root, output);
      for (const relative of report.generated) assert.ok(fs.existsSync(path.join(output, relative)), `${relative} was not written`);
    } finally {
      removeFixture(output);
    }
  });
});

test('a second build reports nothing, since every file already matches', () => {
  withFixture({}, (root) => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-out-'));
    try {
      buildAdapters({out: output, pluginRoot: root});
      const report = buildAdapters({out: output, pluginRoot: root});
      assert.deepEqual(report.drift, []);
      assert.equal(report.inSync, true);
    } finally {
      removeFixture(output);
    }
  });
});

test('check mode names the stale file and leaves the filesystem alone', () => {
  withFixture({}, (root) => {
    const output = fs.mkdtempSync(path.join(os.tmpdir(), 'zanker-out-'));
    try {
      buildAdapters({out: output, pluginRoot: root});
      const target = path.join(output, 'AGENTS.md');
      fs.writeFileSync(target, 'edited by hand\n');

      const report = buildAdapters({out: output, pluginRoot: root, check: true});
      assert.deepEqual(report.drift, ['AGENTS.md']);
      assert.equal(report.inSync, false);
      assert.equal(fs.readFileSync(target, 'utf8'), 'edited by hand\n', 'check mode must not write');

      const repaired = buildAdapters({out: output, pluginRoot: root});
      assert.deepEqual(repaired.drift, ['AGENTS.md']);
      assert.notEqual(fs.readFileSync(target, 'utf8'), 'edited by hand\n', 'a normal build overwrites the edit');
    } finally {
      removeFixture(output);
    }
  });
});

test('writing to the plugin root is allowed only when it is one', () => {
  withFixture({}, (root) => {
    const report = buildAdapters({pluginRoot: root});
    assert.equal(report.root, root);
    assert.equal(report.inSync, false, 'the fixture had no adapters yet');
  });
  withFixture({withMarketplace: false}, (root) => {
    assert.throws(
      () => buildAdapters({pluginRoot: root}),
      /Expected \.claude-plugin\/marketplace\.json at the plugin root/,
    );
  });
});

test('the public entry points default to the installed plugin root', () => {
  assert.ok(skillIndex().length > 0, 'the real plugin has skills');
  assert.match(buildPortableAgentsMarkdown(), /# Zanker: AI Product Design/);
  assert.equal(buildAdapters({check: true}).inSync, true, 'the committed adapters are current');
});
