# Changelog

Notable changes to Zanker. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and the versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

For a plugin whose output is prose a model reads, a breaking change is one that changes what the
agent does, not only one that changes a function signature. A reworded `<process>` phase that
reorders the work is a minor at least.

## [Unreleased]

Nothing yet.

## [1.0.0] - 2026-10-12

First release.

### Added

- The `zanker` agent: a product aware UX and UI specialist with a nine phase process, from
  classifying the task through grounding in the repository, establishing real content shape, naming
  which decisions are genuinely open, structure before surface, enumerating states, rendering,
  verifying and reporting.
- 33 skills covering diagnosis, building, art direction and critique, design systems, quality gates,
  runtime and fixtures, content, media, motion, and governance. The agent's router reaches every one
  of them, and a test fails if it does not.
- 23 knowledge packs, 130 rules, as JSON the agent reads selectively rather than loading whole.
- Optional Node.js scripts: `inspect.sh` for stack detection, `studio.sh` for presenting visual
  alternatives, `sandbox-prepare.sh` and `sandbox-run.sh` for rendering real components, `audit.sh`
  for multi viewport screenshots in light and dark with optional axe-core, `diagnose.sh` for element
  level evidence, `document.sh` for Visual Spec metadata, and `validate.sh`.
- Cross harness support. The plugin is native to Claude Code and Cursor, and generated adapters under
  `adapters/` carry the same contract to Codex, GitHub Copilot, Kiro and OpenCode. `AGENTS.md` is the
  portable form, kept under the 32 KiB cap Codex applies.
- One repository that is both the marketplace and the plugin it ships, through a marketplace entry
  whose source is the root itself.
- A test suite that enforces the contract instead of describing it: 32 tests over the skill contract,
  the router, path containment, remote URL opt in, sandbox consent, Studio isolation, the Visual Spec
  documentation only rule, adapter sync, version consistency across the 38 places a version appears,
  and prose typography.

### Security

- Loopback only preview server with a 160 bit session token, HTML escaped content and mockups
  confined to an iframe with an empty `sandbox` attribute.
- Path containment that rejects any argument resolving outside the project root, with symlinks
  skipped and the traversal bounded in depth and entry count.
- Executing project code requires an explicit `--allow-execution`, and reaching a non loopback URL
  requires an explicit `--allow-remote`.
- No `bin/` directory and no compiled installer, enforced by a test, since several hosts refuse a
  plugin that ships an executable.

[Unreleased]: https://github.com/gfrancodev/zanker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/gfrancodev/zanker/releases/tag/v1.0.0
