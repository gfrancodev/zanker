# Harness adapters

The repository root is the single source of truth. Everything in this directory is **generated** from
it by `bash scripts/build-adapters.sh`, and a test fails if any of it drifts. Do not
edit these files by hand.

| Harness | What it reads | Where it comes from |
| :- | :- | :- |
| Claude Code | the plugin itself | the repository root, via the marketplace |
| Codex | `AGENTS.md` at the repository root | generated, see `codex/` |
| Cursor | `AGENTS.md`, `.cursor/rules/*.mdc`, plugin | `cursor/` |
| Kiro | `AGENTS.md`, `.kiro/steering/*.md` | `kiro/` |
| GitHub Copilot | `AGENTS.md`, `.github/agents/*.agent.md` | `copilot/` |
| OpenCode | `AGENTS.md`, `.opencode/agents/*.md`, `.claude/skills/` | `opencode/` |

## The 33 skills are already portable

Every `SKILL.md` uses the Agent Skills frontmatter contract, `name` plus `description`, which Claude
Code, GitHub Copilot and OpenCode all read. No conversion is needed: the skills only have to be
visible at a path the harness scans. Each adapter's README names that path.

## What is not covered

The optional Node.js scripts under `scripts/` are invoked the same way everywhere,
since they are plain shell and take `--project <absolute path>`. Hooks, MCP wiring and plugin
packaging differ per harness and are not generated; where a harness supports them, its README says so.
