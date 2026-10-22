---
name: zanker-design-audit
description: Audit an existing product UI across hierarchy, affordances, consistency and accessibility. Use when a page needs a structural review of hierarchy, affordances, and consistency with the system.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-design-audit">

<purpose>
Design Audit. Review a page against structure, hierarchy and system consistency.

<why_this_matters>
Finding a defect before implementation costs a sentence; finding it after costs a release.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>review design</trigger>
<trigger>audit page</trigger>
<trigger>page structure</trigger>
</triggers>
<not_for>
Not for judging whether an interface feels premium from a screenshot - use `zanker-design-critique`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>visual-hierarchy</pack>
<pack>quality-gates</pack>
<pack>information-architecture</pack>
</knowledge>

<process>
<step n="1">Inventory key screens and user journeys; prioritize costly issues.</step>
<step n="2">Inspect rendered screenshots and interaction patterns, not only JSX/CSS.</step>
<step n="3">Link each issue to usability impact, evidence, severity and source location.</step>
<step n="4">Separate aesthetic preferences from normatively required accessibility fixes.</step>
</process>

<deliverables>
<deliverable>Prioritized issues list</deliverable>
<deliverable>Annotated evidence</deliverable>
</deliverables>

<acceptance_gates>
<gate>Every critical issue is reproducible</gate>
<gate>Avoid subjective scores without rationale</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Provide a heuristic review with explicitly limited confidence.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-design-audit/SKILL.md`. Claude Code substitutes
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
