# Kiro

Kiro loads an `AGENTS.md` at the workspace root automatically, and reads steering files from
`.kiro/steering/`.

## Install

```sh
cp AGENTS.md /path/to/your-project/
mkdir -p /path/to/your-project/.kiro/steering
cp adapters/kiro/.kiro/steering/zanker.md /path/to/your-project/.kiro/steering/
```

The steering file is set to `inclusion: manual`, so it loads when you reference it rather than on
every interaction. Change it to `always` if you want Zanker's contract in scope permanently, which
costs context on every request.

## Not generated here

Kiro also supports `.kiro/agents/` for custom agents, `.kiro/hooks/` for agent hooks and
`.kiro/settings/mcp.json` for MCP servers. This repository does not generate those, because their
schemas were not verified against Kiro's own documentation while building this adapter. Check
kiro.dev/docs before writing them by hand.
