---
name: zanker-design-system-evolution
description: Safely extend shared components and token sets based on repeated needs. Use for new shared component, design system refactor.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-design-system-evolution">

<purpose>
Design System Evolution. Change a shared component without breaking its existing consumers.

<why_this_matters>
A shared primitive has callers you have not read; the blast radius is the real cost of the change.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>new shared component</trigger>
<trigger>design system refactor</trigger>
</triggers>
<not_for>
Not for creating a component that does not exist yet - use `zanker-component-design`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>design-tokens</pack>
<pack>components-states</pack>
</knowledge>

<process>
<step n="1">Identify repeat usage and semantic reason for extracting abstraction.</step>
<step n="2">Check existing API consumers and token hierarchy.</step>
<step n="3">Add variants without breaking default behavior; provide migration guidance.</step>
<step n="4">Render all shared states and guard with regression tests.</step>
</process>

<deliverables>
<deliverable>Component/API proposal</deliverable>
<deliverable>Migration note</deliverable>
</deliverables>

<acceptance_gates>
<gate>Avoid duplicate primitives</gate>
<gate>Consumers assessed</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Prefer local composition until reuse is proven.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-design-system-evolution/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
