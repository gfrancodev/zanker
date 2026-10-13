# Codex

Codex reads `AGENTS.md` natively, including nested files, and caps each one at 32 KiB. The repository
root `AGENTS.md` is generated to fit inside that cap; a test fails if it grows past it.

## Install

Copy `AGENTS.md` into your project, or keep the Zanker repository as a sibling checkout and point at
it. Nothing else is required, because the router and the full skill catalog are inside
`AGENTS.md`.

```sh
cp AGENTS.md /path/to/your-project/
cp -r . /path/to/your-project/.zanker-agent
```

If your project already has an `AGENTS.md`, append Zanker's content rather than replacing it, or keep
Zanker's in the subdirectory where the frontend lives, since Codex reads nested files.

## Not verified here

MCP server wiring through `~/.codex/config.toml` is outside what this repository generates.
