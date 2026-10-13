# Native installation

## Claude Code  local testing
From an extracted distribution, launch `claude --plugin-dir .` (the `claude` command belongs to the harness, NOT Zanker). Discover `zanker` subagent and `zanker:*` skills; or register the included marketplace:

```sh
claude plugin marketplace add /absolute/path/to/zanker-plugin-v1.2
claude plugin install zanker@zanker-local
```

For a remote marketplace, push the directory structure as a Git repository and add its repository URL in Claude Code. Updating the plugin is controlled by Claude's plugin manager; no files need to be installed in each project.

## Cursor  native local plugin
Copy the repository under `~/.cursor/plugins/local/zanker/`. Restart Cursor or run `Developer: Reload Window`, then open **Customize → Plugins** to see `zanker` and its skills and agent. Local plugin imports can be restricted by workspace policy. Alternatively push the distribution repository and import it into a Cursor marketplace.

## OpenCode / generic  compatibility fallback
These systems do not consume Claude's manifest directly. Use the **one-shot Go installer** from `compat/` to register skills and the subagent in the harness-specific location. Nothing from the Go source/compiler/installer remains in the target repository after installation. The fallback uses a project-local `.zanker/plugin` directory by design.

## Script invocation (optional Node runtime)

```sh
node /path/to/installed/plugin/scripts/bridge.mjs inspect --project /path/to/frontend
node /path/to/installed/plugin/scripts/bridge.mjs studio --project /path/to/frontend
node /path/to/installed/plugin/scripts/bridge.mjs validate
```

`--concepts` is optional and relative to the **target project**. Omit it and the studio uses its built-in concepts.

The plugin scripts do not run automatically on installation. No server, hooks or MCP services are started merely by enabling the plugin.
