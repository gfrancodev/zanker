---
name: zanker-stack-sandbox
description: Render real React/Vite components or standalone HTML in project-local isolated host. Use for test single component, preview without backend, visual sandbox.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-stack-sandbox">

<purpose>
Stack Sandbox. Render the real component in the project's own stack, isolated.

<why_this_matters>
A vanilla recreation proves nothing about the component that actually ships.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>test single component</trigger>
<trigger>preview without backend</trigger>
<trigger>visual sandbox</trigger>
</triggers>
<not_for>
Not for showing alternatives to a human for approval - use `zanker-preview-server`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>frontend-architecture</pack>
<pack>components-states</pack>
</knowledge>

<process>
<step n="1">Run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` to identify stack and global style entries.</step>
<step n="2">Prepare via the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/`.</step>
<step n="3">Review the generated workspace and ask permission to execute target code.</step>
<step n="4">Start via the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/`; inspect states and viewport controls.</step>
<step n="5">Run screenshot audit on local URL; use project-native environment for unsupported stacks or SSR components.</step>
</process>

<deliverables>
<deliverable>.zanker/sandboxes/ID</deliverable>
<deliverable>Running preview URL</deliverable>
</deliverables>

<acceptance_gates>
<gate>No synthetic visual replacement of real component</gate>
<gate>Parity limitations explicit</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Attach to framework-native dev server and audit rendered route.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-stack-sandbox/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/scenario.schema.json</schema>
</contracts>
</resources>

</skill>
