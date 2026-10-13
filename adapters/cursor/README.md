# Cursor

Cursor reads `AGENTS.md` from the project root and any subdirectory, and project rules from
`.cursor/rules/*.mdc`. It also has its own plugin format, which this repository ships at
`.cursor-plugin/plugin.json` at the repository root.

## Install as a plugin, recommended

```sh
cp -r . ~/.cursor/plugins/local/zanker
```

Reload Cursor, then check **Customize → Plugins**. Installation scope is managed by Cursor.

## Or install as rules

```sh
cp AGENTS.md /path/to/your-project/
mkdir -p /path/to/your-project/.cursor/rules
cp adapters/cursor/.cursor/rules/zanker.mdc /path/to/your-project/.cursor/rules/
```

The rule is scoped by `globs` to frontend files and is not always applied, so it loads when the task
touches CSS, HTML or component files.

## Known limit

A global `~/.cursor/AGENTS.md` is not supported; the file has to live in the project.
