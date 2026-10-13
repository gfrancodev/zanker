---
name: zanker-component-design
description: Build reusable accessible UI components in the existing frontend stack. Use for new button, modal, table, component library.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-component-design">

<purpose>
Component Design. Build a reusable component whose states, keyboard behavior and tokens are correct before it is pretty.

<why_this_matters>
A component is copied across a codebase; a defect in it multiplies, so correctness here is cheaper than anywhere else.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>new button</trigger>
<trigger>modal</trigger>
<trigger>table</trigger>
<trigger>component library</trigger>
</triggers>
<not_for>
Not for changing a component that already has consumers across the codebase - use `zanker-design-system-evolution`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>components-states</pack>
<pack>design-tokens</pack>
<pack>frontend-architecture</pack>
<pack>navigation-data</pack>
</knowledge>

<process>
<step n="1">Locate current equivalents; choose extend, compose or create, with rationale.</step>
<step n="2">Define semantic props, states, keyboard behavior, loading/error and disabled logic.</step>
<step n="3">Render in Zanker sandbox with realistic scenarios.</step>
<step n="4">Run visual/accessibility checks and produce patch, examples and acceptance criteria.</step>
</process>

<deliverables>
<deliverable>Component implementation</deliverable>
<deliverable>Scenario fixtures</deliverable>
<deliverable>Test evidence</deliverable>
</deliverables>

<acceptance_gates>
<gate>Uses existing tokens</gate>
<gate>Accessibility semantics correct</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
If component cannot be isolated, use framework-native preview and disclose parity gap.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-component-design/SKILL.md`. Claude Code substitutes
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
