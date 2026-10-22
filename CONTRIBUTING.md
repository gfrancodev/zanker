# Contributing to Zanker

Thanks for considering it. This repository is a Claude Code plugin that also works on Cursor, Kiro,
Copilot, Codex and OpenCode. Most of what makes it useful lives in prose that a model reads, so the
contribution rules are mostly about keeping that prose precise.

## Before anything

```sh
git clone https://github.com/gfrancodev/zanker
cd zanker
git config core.hooksPath scripts/hooks   # once, enables the commit-msg hook
npm test
```

Node.js >= 20. No install step and no dependencies: the test suite, the validator and the adapter
generator all run on the standard library. Playwright and axe-core are optional and only needed to
exercise `audit.sh` and `diagnose.sh` against a real browser.

## The three commands that gate everything

```sh
npm test                                 # 167 tests, the contract itself
bash scripts/validate.sh                 # knowledge packs, skills, JSON schemas
bash scripts/build-adapters.sh --check   # adapters still match their source
```

The suite is written to fail rather than to describe. If you are unsure whether a change is allowed,
make it and run the tests: the failure message is the specification.

Every module under `src/` is at 100 percent of lines, branches and functions, and `npm run coverage`
reports it. That is a floor, not a trophy: a new branch with no test is a branch nobody has run. When
a line is genuinely unreachable, delete it rather than contriving a test for it. Twice during the
rewrite the coverage report found dead code that way.

Modules that reach outside the process take a seam instead of hiding the dependency. `auditURL` and
`diagnoseElement` accept `loadChromium`, `runSandbox` accepts `spawnProcess`, and the functions
Playwright serialises into the page are named and exported so they can run against a stub document.
Prefer a seam to a mock of the filesystem: the tests here use real temporary directories.

## The layout

```
zanker/
├── .claude-plugin/        plugin.json and marketplace.json, source "."
├── .cursor-plugin/        the same pair for Cursor
├── agents/zanker.md       role, 9-phase process, router over all 34 skills
├── skills/<name>/         34 skills, one SKILL.md each
├── knowledge/             23 JSON Knowledge Packs, 130 rules
├── scripts/               optional Node.js tools, PowerShell twins included
├── src/                   the modules those scripts call
├── schemas/               JSON Schemas for knowledge, scenarios, reviews
├── templates/             starting shapes for the artifacts skills produce
├── assets/                the plugin icon
├── tests/                 the suite that enforces all of the above
├── .github/               issue forms and the pull request checklist
├── AGENTS.md              portable contract, read by five other tools (generated)
└── adapters/              per-tool layouts (generated)
```

One repository is both the marketplace and the plugin it ships: the marketplace entry uses
`"source": "."`, so `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` sit side by
side at the root. That choice is what makes the next two sections matter.

## What is generated and must not be hand edited

`AGENTS.md` and everything under `adapters/` are built from `agents/zanker.md` and the skills by
`src/adapters.mjs`. They carry a banner saying so, a test fails if they drift, and an edit to them is
lost on the next build. Change the source, then run:

```sh
bash scripts/build-adapters.sh
```

## Everything tracked here is installed on a user's machine

The marketplace entry sets `source: "."`, so the plugin root is the repository root. Installing copies
the whole tracked tree into the plugin cache, and a plugin has no ignore file, no allowlist and no
`files` key. Whatever you commit, a user receives. `tests/install-surface.test.mjs` is the only thing
standing in the way, so read its failure message before working around it.

Two rules follow from that. A new top-level entry has to be added to `ALLOWED_TOP_LEVEL` on purpose,
which is the moment to ask whether it belongs in an install at all. And an asset nothing references is
deleted rather than kept, because it is pure weight on every install.

Never add a `bin/` directory. Claude Code puts it on the Bash tool's `PATH`, and claude.ai and Cowork
refuse to install a plugin that has one.

## Do not name `agents` or `commands` in the manifest

Measured against Claude Code 2.1.296: a component key whose value is a file path turns off the default
scan and then loads nothing. Both `"agents": "./agents/zanker.md"` and the array form leave the plugin
reporting `Agents (0)`, with no error, no warning, and `claude plugin validate --strict` still passing.
A directory value works, and `agents` accepts only files, so `agents` has no working form. Leave
`agents/` and `commands/` to the default scan. A test fails if the keys come back.

## Prompts carry structure in tags, not in markdown

Every agent, skill, command and rule is XML. No tables, no bullet lists, no numbered lists, no bold
labels standing in for field names.

The reason is not taste. Markdown puts the relationship in a column, an indent or a font weight, so a
reader has to rebuild what the layout meant before using it, and nothing else in the prompt can refer
to it. A tag names the relationship in place, and `<process>` can point at `<skill_router>` because
both are addressable.

Backticks stay. Marking a token as code is lexical, not structural, and dropping them would make
`audit.sh --axe` indistinguishable from ordinary prose.

The full contract is in `AGENT.md` under `<prompt_conventions>`. A test enforces it over `agents/`,
`skills/`, `commands/`, `rules/`, `AGENT.md`, `AGENTS.md` and the generated adapters. Documentation
and README files are exempt, since people read those.

## No em-dash

Not in prompts, not in documentation, not in your own writing here. Almost nobody types one, so it is
one of the most reliable signals that text was machine written, and this project is about not looking
machine written. The same goes for the en-dash and the ellipsis character: use a plain hyphen for
ranges and three dots. A test fails the suite if any of the three reaches a tracked file.

## Adding a skill

1. Create `skills/<name>/SKILL.md`. Copy the shape of an existing one. It needs `<skill name="...">`
   as the root and all of `<purpose>` holding a `<why_this_matters>`, `<when_to_use>` with
   `<triggers>`, `<knowledge>`, `<process>` with numbered `<step n="...">`, `<deliverables>`,
   `<acceptance_gates>`, `<fallback>`, `<invariants>` and `<resources>`.
2. Every list section must actually hold its element: `<trigger>`, `<pack>`, `<deliverable>`,
   `<gate>`, `<invariant>`. An empty section fails.
3. Every `<pack>` must name a real id from `knowledge/index.json`, and must match the `knowledge`
   array in the skill's `manifest.json`. Those two disagreeing is a test failure.
4. Create `skills/<name>/manifest.json` next to it, with the same `version` as every other manifest.
5. Register the skill in the agent's router in `agents/zanker.md`, as a
   `<route skill="<name>">signal</route>` inside the `<class>` it belongs to. The route set must equal
   the skills directory exactly, so an unregistered skill and a route pointing at nothing both fail.
6. Run `bash scripts/build-adapters.sh`, then the three gate commands.

`<why_this_matters>` is not decoration. A model that knows why a step exists adapts it when the
situation is unusual; a model given a bare instruction performs the ceremony and misses the point.

## Adding a knowledge pack

Packs are JSON under `knowledge/<category>/`, registered in `knowledge/index.json` and validated
against `schemas/knowledge.schema.json`. Each rule needs a real source. Synthesise from public
standards and official documentation, cite them, and never copy proprietary course material or
paywalled content. `scripts/validate.sh` checks the shape; it cannot check that you were honest about
the source, so that part is on you.

## Commits

Subjects open with a [gitmoji](https://gitmoji.dev), then a lowercase summary of what changed.

```
✨ add a slop detector with calibrated thresholds
🐛 audit.sh reported dark scheme results under the light filename
📝 document the knowledge pack refresh pipeline
```

`scripts/hooks/commit-msg` rejects a subject that does not open with one of the 75 official gitmoji,
and a test checks the last 100 subjects, so the convention holds even if you never installed the
hook. The ones that come up most here: 🎉 begin a project, ✨ new feature, 🐛 fix a bug, ♻️ refactor,
🎨 structure or format, 📝 documentation, ✅ tests, 🔧 configuration, 🔖 release tag.

Write the body for someone reading `git log` in a year. Say what changed and why it was worth
changing, not what the diff already shows.

## Pull requests

Open an issue first for anything that changes the agent's process, the skill contract or the router.
Those decide output quality across every task, so they are worth discussing before the work.

Small fixes, a new knowledge pack, documentation, a new skill that fits the existing classes: just
send the PR. Include what you ran and what you did not. If you changed anything visual, attach the
screenshot; the project's own rule is that no screenshot means untested, not passed.

## Reporting a bug

Say which harness you are on (Claude Code, Cursor, Kiro, Copilot, Codex, OpenCode), the plugin
version, and what you asked Zanker to do. The behavior of a prompt change is hard to reproduce from a
summary, so paste the actual exchange when you can.

Security issues do not go in the tracker. See [SECURITY.md](SECURITY.md).

## Scope

Zanker is for frontend UX and UI work inside a codebase that already exists: diagnosing a visual
defect, building a screen or component in the project's own design system, art direction, responsive
and accessibility review, icons, media, motion, and visual QA.

It is not a general coding agent, not a backend tool, and not a design file editor. A proposal that
pulls it toward those is likely to be declined, which is a scope decision rather than a judgment of
the idea.
