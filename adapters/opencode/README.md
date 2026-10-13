# OpenCode

OpenCode reads agents from `.opencode/agents/*.md` and, importantly, reads skills from
`.claude/skills/<name>/SKILL.md`, `.opencode/skills/<name>/SKILL.md` and
`.agents/skills/<name>/SKILL.md`.

## Install

```sh
cp AGENTS.md /path/to/your-project/
mkdir -p /path/to/your-project/.opencode/agents
cp adapters/opencode/.opencode/agents/zanker.md /path/to/your-project/.opencode/agents/

# the skills load unchanged, no conversion
cp -r skills /path/to/your-project/.opencode/skills
```

Global install instead of per project: use `~/.config/opencode/agents/` and
`~/.config/opencode/skills/`.

## Why no conversion is needed

OpenCode's skill contract is the Agent Skills frontmatter, `name` and `description`, with the folder
name matching `name`. Zanker's skills already satisfy both, and the suite enforces it.

The agent is declared `mode: primary` so it appears in the agent picker. Change it to `subagent` to
invoke it on demand with `@zanker` instead.
