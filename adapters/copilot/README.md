# GitHub Copilot

Copilot reads `AGENTS.md` from the repository root, repository-wide guidance from
`.github/copilot-instructions.md`, and custom agents from `.github/agents/*.agent.md`.

## Install

```sh
cp AGENTS.md /path/to/your-project/
mkdir -p /path/to/your-project/.github/agents
cp adapters/copilot/.github/agents/zanker.agent.md /path/to/your-project/.github/agents/
```

Invoke the agent by name in Copilot CLI, in VS Code, or through the coding agent.

## Skills

Copilot reads skills from directories holding a `SKILL.md`. Zanker's 33 skills already use that
format, so copy them where Copilot scans:

```sh
cp -r skills /path/to/your-project/.github/skills
```

## Surfaces differ

`AGENTS.md` support varies by Copilot surface, covering Copilot Chat, the coding agent, code review
on github.com and the Copilot CLI. Verify on the surface your team uses before relying on it.
