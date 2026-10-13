---
name: zanker-information-architecture
description: Improve labels, navigation, content grouping and findability. Use when menus, labels, or dashboard grouping must change and the flow is already settled.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-information-architecture">

<purpose>
Information Architecture. Decide what goes where and what it is called, before any of it is drawn.

<why_this_matters>
Navigation is the hardest thing to change after launch because every other screen depends on its shape.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>menu overhaul</trigger>
<trigger>labels and grouping</trigger>
<trigger>dashboard navigation</trigger>
</triggers>
<not_for>
Not for the end-to-end flow - use `zanker-ux-strategy`. Not for the sentences on the screen - use `zanker-content-design`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>information-architecture</pack>
<pack>ux-research</pack>
<pack>navigation-data</pack>
<pack>product-discovery</pack>
</knowledge>

<process>
<step n="1">List tasks and user terminology; identify high-frequency journeys.</step>
<step n="2">Sketch categories and routes; check current information architecture.</step>
<step n="3">Test whether key tasks remain discoverable without guessing or magic icons.</step>
<step n="4">Document redirects, active states, breadcrumbs and back behavior.</step>
</process>

<deliverables>
<deliverable>Navigation map</deliverable>
<deliverable>Label proposals</deliverable>
</deliverables>

<acceptance_gates>
<gate>Main tasks reachable</gate>
<gate>No hidden critical terms</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Mark proposed structure as untested if no user testing is available.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-information-architecture/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/product.schema.json</schema>
<template>${CLAUDE_PLUGIN_ROOT}/templates/product.context.json</template>
</contracts>
</resources>

</skill>
