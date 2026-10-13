import fs from 'node:fs';
import path from 'node:path';
import {PLUGIN_ROOT as DEFAULT_PLUGIN_ROOT, readJsonFile} from './common.mjs';

/**
 * Generates the per-harness adapter files from the canonical plugin source.
 *
 * This is repository maintenance, not a runtime feature: everything it emits is
 * derived from `agents/zanker.md`, `skills/` and `rules/zanker.mdc`, never authored.
 * A test fails when a generated file drifts from its source.
 *
 * Execution flow, in the order this file defines it:
 *   1. `MarkdownDocument`    parses one source file a single time
 *   2. `toPortableText`      strips the variable only Claude Code substitutes
 *   3. `readSkillCatalog`    enumerates the installed skills
 *   4. `AgentContract`       the agent's sections, validated on construction
 *   5. `renderTaggedBlock`   the one shape every emitted block has
 *   6. `ADAPTER_TARGETS`     one strategy per generated file
 *   7. `AdapterBuilder`      compares, and writes unless asked only to check
 *   8. public API
 */

/** Relative path of the file every adapter is generated from. */
const AGENT_SOURCE_PATH = 'agents/zanker.md';

/** Sections an agent document must declare for an adapter to be buildable. */
const REQUIRED_AGENT_SECTIONS = Object.freeze([
  'role',
  'why_this_matters',
  'frontend_aesthetics',
  'existing_system_first',
  'process',
  'skill_router',
  'tooling',
  'safety',
  'honesty',
  'output_contract',
]);

/**
 * Header stamped on every generated file so a reader knows not to edit it.
 *
 * @param {string} sourcePath Repository-relative path the content derives from.
 * @returns {string} An HTML comment safe to place at the top of a Markdown file.
 */
function buildGeneratedBanner(sourcePath) {
  return `<!-- GENERATED FILE. Do not edit by hand.
Source: ${sourcePath}
Regenerate: bash scripts/build-adapters.sh
A test fails if this file drifts from its source. -->`;
}

/**
 * A Markdown file split once into its YAML front matter and its body.
 *
 * Parsing happens in the constructor so a document read by several builders is
 * never parsed twice, and so a malformed source fails at the point it is loaded
 * rather than at the point a section is requested.
 */
class MarkdownDocument {
  /** @type {string} */ #frontMatterText;
  /** @type {string} */ #bodyText;
  /** @type {string} */ #sourceLabel;

  /**
   * @param {string} rawText Full contents of the file.
   * @param {string} sourceLabel Path used in error messages.
   */
  constructor(rawText, sourceLabel) {
    const match = /^---\n([\s\S]*?)\n---\n/.exec(rawText);
    this.#frontMatterText = match ? match[1] : '';
    this.#bodyText = match ? rawText.slice(match[0].length) : rawText;
    this.#sourceLabel = sourceLabel;
  }

  /**
   * Reads a file from disk and parses it.
   *
   * @param {string} absolutePath Absolute path of the Markdown file.
   * @param {string} sourceLabel Path used in error messages.
   * @returns {MarkdownDocument}
   */
  static read(absolutePath, sourceLabel) {
    return new MarkdownDocument(fs.readFileSync(absolutePath, 'utf8'), sourceLabel);
  }

  /**
   * Reads one `key: value` line from the front matter.
   *
   * @param {string} fieldName Key to look up.
   * @returns {string} The trimmed value, or an empty string when the key is absent.
   */
  readField(fieldName) {
    const match = new RegExp(`^${fieldName}: (.+)$`, 'm').exec(this.#frontMatterText);
    if (!match) return '';
    return match[1].trim();
  }

  /**
   * Reads the contents of one XML section from the body.
   *
   * @param {string} tagName Section to extract, without angle brackets.
   * @returns {string} The trimmed contents of the section.
   * @throws {Error} When the section is absent, because emitting an empty block
   *   would ship a prompt with a silently missing instruction.
   */
  readSection(tagName) {
    const match = new RegExp(`<${tagName}>\\n([\\s\\S]*?)\\n</${tagName}>`).exec(this.#bodyText);
    if (!match) throw new Error(`${this.#sourceLabel} has no <${tagName}> section`);
    return match[1].trim();
  }
}

/**
 * Rewrites Claude Code path variables as repository-relative paths.
 *
 * No harness other than Claude Code substitutes `${CLAUDE_PLUGIN_ROOT}`, and no
 * harness other than Cursor substitutes `${CURSOR_PLUGIN_ROOT}`, so portable
 * output that kept them would instruct an agent to open a path that cannot exist.
 *
 * @param {string} text Source text that may contain either variable.
 * @returns {string} The same text with both variables resolved to relative paths.
 */
function toPortableText(text) {
  return text
    .replaceAll('${CLAUDE_PLUGIN_ROOT}/', '')
    .replaceAll('${CLAUDE_PLUGIN_ROOT}', '.')
    .replaceAll('${CURSOR_PLUGIN_ROOT}/', '')
    .replaceAll('${CURSOR_PLUGIN_ROOT}', '.');
}

/**
 * @typedef {object} SkillEntry
 * @property {string} name Directory name, which is also the skill identifier.
 * @property {string} description Front matter description that decides when it loads.
 * @property {string[]} triggers Phrases from the skill manifest that select it.
 */

/**
 * Enumerates every installed skill, sorted by name so output is deterministic.
 *
 * @param {string} pluginRoot Absolute path of the plugin root.
 * @returns {SkillEntry[]}
 */
function readSkillCatalog(pluginRoot) {
  const skillsDirectory = path.join(pluginRoot, 'skills');
  return fs
    .readdirSync(skillsDirectory, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((name) => {
      const document = MarkdownDocument.read(
        path.join(skillsDirectory, name, 'SKILL.md'),
        `skills/${name}/SKILL.md`,
      );
      const manifest = readJsonFile(path.join(skillsDirectory, name, 'manifest.json'));
      return {
        name,
        description: document.readField('description'),
        triggers: manifest.triggers || [],
      };
    });
}

/**
 * The agent contract, with every required section resolved and validated once.
 *
 * Validating in the constructor means a builder can ask for any required section
 * without guarding, and a source file missing a section fails before any file is
 * written rather than after half of them are.
 */
class AgentContract {
  /** @type {string} */ #description;
  /** @type {Map<string, string>} */ #sections = new Map();

  /** @param {MarkdownDocument} document Parsed `agents/zanker.md`. */
  constructor(document) {
    this.#description = document.readField('description');
    if (!this.#description) throw new Error(`${AGENT_SOURCE_PATH} has no description in its front matter`);
    for (const name of REQUIRED_AGENT_SECTIONS) this.#sections.set(name, document.readSection(name));
  }

  /**
   * @param {string} pluginRoot Absolute path of the plugin root.
   * @returns {AgentContract}
   */
  static load(pluginRoot) {
    return new AgentContract(
      MarkdownDocument.read(path.join(pluginRoot, AGENT_SOURCE_PATH), AGENT_SOURCE_PATH),
    );
  }

  /** @returns {string} The agent's one-line description. */
  get description() {
    return this.#description;
  }

  /**
   * @param {string} name One of {@link REQUIRED_AGENT_SECTIONS}.
   * @returns {string} The section exactly as the agent declares it.
   */
  section(name) {
    return this.#sections.get(name);
  }

  /**
   * @param {string} name One of {@link REQUIRED_AGENT_SECTIONS}.
   * @returns {string} The section with Claude-only path variables resolved.
   */
  portableSection(name) {
    return toPortableText(this.section(name));
  }
}

/**
 * Wraps content in an XML tag and leaves one blank line after it.
 *
 * Every block of every generated file has this shape, so it exists once.
 *
 * @param {string} tagName Tag to wrap the content in.
 * @param {string} content Already assembled body of the block.
 * @returns {string[]} Lines ready to be joined with newlines.
 */
function renderTaggedBlock(tagName, content) {
  return [`<${tagName}>`, content, `</${tagName}>`, ''];
}

/**
 * @typedef {object} AdapterContext
 * @property {AgentContract} agent Sections of the canonical agent.
 * @property {SkillEntry[]} skills Every installed skill.
 * @property {string} cursorRuleText Verbatim contents of `rules/zanker.mdc`.
 */

/**
 * Builds the portable contract that Codex, Cursor, Kiro, Copilot and OpenCode read.
 *
 * Codex caps `AGENTS.md` at 32 KiB, so this carries the whole operating contract
 * but points at the repository for knowledge packs and scripts instead of inlining them.
 *
 * @param {AdapterContext} context
 * @returns {string} Complete file contents.
 * @throws {Error} When the router has no `<class>` directive to port.
 */
function renderPortableAgentsMarkdown(context) {
  const {agent, skills} = context;
  const lines = [
    buildGeneratedBanner(AGENT_SOURCE_PATH),
    '',
    '# Zanker: AI Product Design & Visual Engineering Agent',
    '',
    'This file is the portable agent contract, read natively by Codex, Cursor, Kiro, GitHub',
    'Copilot and OpenCode. Claude Code loads the same contract through this repository,',
    'which is the canonical source everything here is generated from.',
    '',
  ];

  for (const name of ['role', 'why_this_matters', 'frontend_aesthetics', 'existing_system_first', 'process']) {
    lines.push(...renderTaggedBlock(name, agent.portableSection(name)));
  }

  lines.push(...renderTaggedBlock('skill_router', renderPortableRouter(agent)));
  lines.push(...renderTaggedBlock('skill_catalog', renderSkillCatalogBlock(skills)));

  for (const name of ['tooling', 'safety', 'honesty', 'output_contract']) {
    lines.push(...renderTaggedBlock(name, agent.portableSection(name)));
  }

  lines.push(
    ...renderTaggedBlock(
      'knowledge',
      [
        'Read `knowledge/index.json` first, then load only the packs, schemas, and templates',
        'the selected skill names. Never paste the whole corpus, and never paste all 130 rules, into context.',
      ].join('\n'),
    ),
  );

  // Every block leaves a blank line after it, including the last one, so the
  // trailing run is trimmed once here rather than special cased at the end.
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

/**
 * Ports the router, dropping the agent's own preamble.
 *
 * The preamble points at `${CLAUDE_PLUGIN_ROOT}`, so the portable file replaces it.
 * The cut is structural, taken at the first `<class>`, so rewording the preamble
 * cannot orphan one of its lines into the output.
 *
 * @param {AgentContract} agent
 * @returns {string} Body of the portable `<skill_router>`.
 * @throws {Error} When the router declares no `<class>`.
 */
function renderPortableRouter(agent) {
  const router = agent.section('skill_router');
  const firstClassIndex = router.indexOf('<class ');
  if (firstClassIndex < 0) throw new Error('skill_router has no <class> directive to port');
  return [
    'Read this router before acting. Load only the skills the task needs, from',
    '`skills/<name>/SKILL.md`, and load them before you act. Each `<route>` says when that',
    'skill applies; its `skill` attribute names the file to load when that signal fires.',
    'The loaded skill then reads only the knowledge packs, schemas, and templates it names.',
    'The methodology in `rules/zanker.mdc` already applies (anti-slop, existing system first,',
    'evidence). Do not paste that rule again, and do not paste all 130 knowledge rules into context.',
    '',
    toPortableText(router.slice(firstClassIndex).trim()),
  ].join('\n');
}

/**
 * Lists every skill with the description that decides when it loads.
 *
 * @param {SkillEntry[]} skills
 * @returns {string} Body of the `<skill_catalog>` block.
 */
function renderSkillCatalogBlock(skills) {
  return [
    `All ${skills.length} skills, with the description that decides when each one loads.`,
    '',
    ...skills.map((skill) => `<skill name="${skill.name}">${skill.description}</skill>`),
  ].join('\n');
}

/**
 * @typedef {{section: string} | {tag: string, lines: string[]}} DocumentBlock
 */

/**
 * @typedef {object} HarnessLayout
 * @property {(agent: AgentContract) => string[]} frontMatter Lines between the `---` fences.
 * @property {string} [heading] Optional Markdown title placed after the banner.
 * @property {DocumentBlock[]} blocks Body of the document, in order.
 */

/**
 * Assembles a harness-specific agent file from a declarative layout.
 *
 * Copilot, OpenCode and Kiro differ only in their front matter, an optional
 * heading, and which blocks appear in what order, so one renderer serves all three.
 *
 * Sections are ported, never copied raw. None of these three harnesses substitutes
 * `${CLAUDE_PLUGIN_ROOT}`, so a raw section would hand the agent a literal path that
 * cannot resolve.
 *
 * @param {AgentContract} agent
 * @param {HarnessLayout} layout
 * @returns {string} Complete file contents.
 */
function renderHarnessAgent(agent, layout) {
  const lines = ['---', ...layout.frontMatter(agent), '---', '', buildGeneratedBanner(AGENT_SOURCE_PATH), ''];
  if (layout.heading) lines.push(layout.heading, '');
  for (const block of layout.blocks) {
    if ('section' in block) {
      lines.push(...renderTaggedBlock(block.section, agent.portableSection(block.section)));
      continue;
    }
    lines.push(...renderTaggedBlock(block.tag, block.lines.join('\n')));
  }
  return lines.join('\n');
}

/** Layout of the GitHub Copilot custom agent file. */
const COPILOT_LAYOUT = Object.freeze({
  frontMatter: (agent) => ['name: zanker', `description: ${agent.description}`],
  blocks: [
    {section: 'role'},
    {section: 'why_this_matters'},
    {section: 'frontend_aesthetics'},
    {section: 'process'},
    {
      tag: 'skills',
      lines: [
        'Skills live under `skills/<name>/SKILL.md` in the Zanker repository. Copy that directory to a',
        'location Copilot scans for skills, or read them directly. The full router is in `AGENTS.md`.',
      ],
    },
    {section: 'safety'},
    {section: 'honesty'},
    {section: 'output_contract'},
  ],
});

/** Layout of the OpenCode primary agent file. */
const OPENCODE_LAYOUT = Object.freeze({
  frontMatter: (agent) => [`description: ${agent.description}`, 'mode: primary'],
  blocks: [
    {section: 'role'},
    {section: 'why_this_matters'},
    {section: 'frontend_aesthetics'},
    {section: 'process'},
    {
      tag: 'skills',
      lines: [
        'OpenCode reads skills from `.claude/skills/<name>/SKILL.md`, `.opencode/skills/<name>/SKILL.md`',
        "and `.agents/skills/<name>/SKILL.md`. Zanker's 33 skills use that exact format already, so copy",
        "Zanker's `skills` directory to any of those paths and they load unchanged. The router is in `AGENTS.md`.",
      ],
    },
    {section: 'safety'},
    {section: 'honesty'},
    {section: 'output_contract'},
  ],
});

/** Layout of the Kiro steering file. */
const KIRO_LAYOUT = Object.freeze({
  frontMatter: () => ['inclusion: manual'],
  heading: '# Zanker: frontend UX/UI agent',
  blocks: [
    {section: 'role'},
    {section: 'why_this_matters'},
    {section: 'frontend_aesthetics'},
    {section: 'process'},
    {section: 'safety'},
    {section: 'honesty'},
    {
      tag: 'reference',
      lines: [
        'Kiro also loads an `AGENTS.md` at the workspace root automatically; that file carries the full',
        'skill router and catalog. Skills are at `skills/<name>/SKILL.md` in the Zanker repository.',
      ],
    },
  ],
});

/**
 * @typedef {object} AdapterTarget
 * @property {string} publishedPath Path relative to the repository root.
 * @property {(context: AdapterContext) => string} build Produces the file contents.
 */

/**
 * Every file this module generates, one strategy each.
 *
 * Adding a harness means adding an entry here. Nothing else branches on harness.
 *
 * @type {readonly AdapterTarget[]}
 */
const ADAPTER_TARGETS = Object.freeze([
  {
    publishedPath: 'AGENTS.md',
    build: (context) => renderPortableAgentsMarkdown(context),
  },
  {
    publishedPath: 'adapters/copilot/.github/agents/zanker.agent.md',
    build: (context) => renderHarnessAgent(context.agent, COPILOT_LAYOUT),
  },
  {
    publishedPath: 'adapters/opencode/.opencode/agents/zanker.md',
    build: (context) => renderHarnessAgent(context.agent, OPENCODE_LAYOUT),
  },
  {
    publishedPath: 'adapters/kiro/.kiro/steering/zanker.md',
    build: (context) => renderHarnessAgent(context.agent, KIRO_LAYOUT),
  },
  {
    publishedPath: 'adapters/cursor/.cursor/rules/zanker.mdc',
    build: (context) => context.cursorRuleText,
  },
]);

/**
 * Reads every source the targets need, once.
 *
 * @param {string} pluginRoot Absolute path of the plugin root.
 * @returns {AdapterContext}
 */
function readAdapterContext(pluginRoot) {
  return {
    agent: AgentContract.load(pluginRoot),
    skills: readSkillCatalog(pluginRoot),
    cursorRuleText: fs.readFileSync(path.join(pluginRoot, 'rules', 'zanker.mdc'), 'utf8'),
  };
}

/**
 * Confirms a directory is the plugin root before anything is written into it.
 *
 * The repository root and the plugin root are the same directory: the marketplace
 * entry uses source "." so one repository is both the catalog and the plugin it
 * ships. `marketplace.json` is what distinguishes that root from any other folder.
 *
 * @param {string} pluginRoot Absolute path to verify.
 * @returns {string} The same path, once verified.
 * @throws {Error} When the directory is not a plugin root.
 */
function assertPluginRoot(pluginRoot) {
  if (fs.existsSync(path.join(pluginRoot, '.claude-plugin', 'marketplace.json'))) return pluginRoot;
  throw new Error(`Expected .claude-plugin/marketplace.json at the plugin root ${pluginRoot}`);
}

/**
 * @typedef {object} AdapterBuildReport
 * @property {string} root Directory the files were compared against.
 * @property {string[]} generated Published path of every target.
 * @property {string[]} drift Targets whose content differs from what is on disk.
 * @property {boolean} inSync True when nothing drifted.
 */

/** Compares generated content against disk, and writes it unless asked only to check. */
class AdapterBuilder {
  /** @type {string} */ #outputRoot;
  /** @type {boolean} */ #checkOnly;
  /** @type {AdapterContext} */ #context;

  /**
   * @param {object} options
   * @param {string} options.outputRoot Directory to compare against and write into.
   * @param {boolean} options.checkOnly Report drift without touching the filesystem.
   * @param {AdapterContext} options.context Sources every target builds from.
   */
  constructor({outputRoot, checkOnly, context}) {
    this.#outputRoot = outputRoot;
    this.#checkOnly = checkOnly;
    this.#context = context;
  }

  /** @returns {AdapterBuildReport} */
  run() {
    const drift = [];
    for (const target of ADAPTER_TARGETS) {
      const content = target.build(this.#context);
      const destination = path.join(this.#outputRoot, target.publishedPath);
      if (this.#readIfPresent(destination) === content) continue;
      drift.push(target.publishedPath);
      if (this.#checkOnly) continue;
      this.#write(destination, content);
    }
    return {
      root: this.#outputRoot,
      generated: ADAPTER_TARGETS.map((target) => target.publishedPath),
      drift,
      inSync: drift.length === 0,
    };
  }

  /**
   * @param {string} absolutePath File to read.
   * @returns {string|null} Contents, or null when the file does not exist yet.
   */
  #readIfPresent(absolutePath) {
    if (!fs.existsSync(absolutePath)) return null;
    return fs.readFileSync(absolutePath, 'utf8');
  }

  /**
   * @param {string} absolutePath File to write, creating parent directories.
   * @param {string} content Contents to write.
   * @returns {void}
   */
  #write(absolutePath, content) {
    fs.mkdirSync(path.dirname(absolutePath), {recursive: true});
    fs.writeFileSync(absolutePath, content);
  }
}

/**
 * Enumerates the installed skills.
 *
 * @param {string} [pluginRoot] Defaults to the installed plugin root.
 * @returns {SkillEntry[]}
 */
export function skillIndex(pluginRoot = DEFAULT_PLUGIN_ROOT) {
  return readSkillCatalog(pluginRoot);
}

/**
 * Builds the portable `AGENTS.md` contract without writing it.
 *
 * @param {string} [pluginRoot] Defaults to the installed plugin root.
 * @returns {string} Complete file contents.
 */
export function buildPortableAgentsMarkdown(pluginRoot = DEFAULT_PLUGIN_ROOT) {
  return renderPortableAgentsMarkdown(readAdapterContext(pluginRoot));
}

/**
 * Regenerates every harness adapter, or reports which ones are stale.
 *
 * @param {object} [options]
 * @param {string} [options.out] Directory to write into. Defaults to the plugin root,
 *   which is verified to be one before anything is written.
 * @param {boolean} [options.check] Report drift without touching the filesystem.
 * @param {string} [options.pluginRoot] Where the sources are read from.
 * @returns {AdapterBuildReport}
 */
export function buildAdapters({out, check = false, pluginRoot = DEFAULT_PLUGIN_ROOT} = {}) {
  const outputRoot = out ? path.resolve(out) : assertPluginRoot(pluginRoot);
  return new AdapterBuilder({
    outputRoot,
    checkOnly: check === true,
    context: readAdapterContext(pluginRoot),
  }).run();
}
