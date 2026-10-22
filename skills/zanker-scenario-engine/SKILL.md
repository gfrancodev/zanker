---
name: zanker-scenario-engine
description: Build deterministic mock states for loading, error, empty, overflow and user permissions. Use for component states, fixture design, no backend.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-scenario-engine">

<purpose>
Scenario Engine. Build fixtures that include the ugly cases, not the tidy ones.

<why_this_matters>
Screens break on the longest string and the empty list, and neither appears in placeholder data.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>component states</trigger>
<trigger>fixture design</trigger>
<trigger>no backend</trigger>
</triggers>
<not_for>
Not for standing in for an unavailable backend or auth provider - use `zanker-dependency-mocking`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>components-states</pack>
<pack>forms-validation</pack>
</knowledge>

<process>
<step n="1">List all distinct user-visible states and relevant transitions.</step>
<step n="2">Create JSON array of id/label/props fixtures using synthetic data.</step>
<step n="3">Supply wrapper/provider mocks for network, auth, locale and feature flags when needed.</step>
<step n="4">Run previews at mobile and desktop sizes and check recovery interactions.</step>
</process>

<deliverables>
<deliverable>scenarios.json</deliverable>
<deliverable>State matrix</deliverable>
</deliverables>

<acceptance_gates>
<gate>No production PII</gate>
<gate>Relevant edge cases covered</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Document unavailable states and recommend integrated tests.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-scenario-engine/SKILL.md`. Claude Code substitutes
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
