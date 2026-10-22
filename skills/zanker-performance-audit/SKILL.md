---
name: zanker-performance-audit
description: Check UI media cost, font behavior, interactions and layout instability. Use for slow landing page, heavy animation, images.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-performance-audit">

<purpose>
Performance Audit. Find what makes the interface slow to render and interact with.

<why_this_matters>
Perceived speed is part of perceived quality; a beautiful screen that janks reads as cheap.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>slow landing page</trigger>
<trigger>heavy animation</trigger>
<trigger>images</trigger>
</triggers>
<not_for>
Not for designing a new transition or microinteraction - use `zanker-motion-design`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>performance</pack>
<pack>media-production</pack>
</knowledge>

<process>
<step n="1">Inventory fonts, videos and images that contribute to first paint.</step>
<step n="2">Review intrinsic image sizing, lazy loading and layout shift risk.</step>
<step n="3">Measure real Web Vitals with suitable field tooling where available; avoid inferring LCP/INP from screenshots.</step>
<step n="4">Provide prioritized fixes with estimated UX impact.</step>
</process>

<deliverables>
<deliverable>Performance notes</deliverable>
<deliverable>Optimization plan</deliverable>
</deliverables>

<acceptance_gates>
<gate>No invented field metrics</gate>
<gate>High-impact media risks flagged</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Use source-level resource review and document no field data.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-performance-audit/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/design-review.schema.json</schema>
<template>${CLAUDE_PLUGIN_ROOT}/templates/review.json</template>
</contracts>
</resources>

</skill>
