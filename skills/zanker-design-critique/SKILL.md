---
name: zanker-design-critique
description: Critique rendered interface for coherence, hierarchy, suitability and visual polish. Use when judging a rendered screenshot for whether it reads as considered or premium.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-design-critique">

<purpose>
Design Critique. Judge whether an interface actually reads as considered, from the rendered evidence.

<why_this_matters>
Plausible-looking output is the failure mode of generated UI, so a critique pass against stated criteria is what separates finished from first-draft.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>is this UI premium</trigger>
<trigger>screenshot critique</trigger>
<trigger>design review</trigger>
</triggers>
<not_for>
Not for a structural review of a page's hierarchy and system consistency - use `zanker-design-audit`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>visual-hierarchy</pack>
<pack>quality-gates</pack>
<pack>product-discovery</pack>
</knowledge>

<process>
<step n="1">Review screenshot at realistic viewport with product audience and task in mind.</step>
<step n="2">Score hierarchy, typographic quality, spacing, affordances, identity, states and readability with evidence.</step>
<step n="3">Differentiate normative violations from taste or aesthetic preference.</step>
<step n="4">Recommend concrete improvements with screenshot positions and expected effect.</step>
</process>

<deliverables>
<deliverable>Critique with screenshot references</deliverable>
<deliverable>Prioritized improvements</deliverable>
</deliverables>

<acceptance_gates>
<gate>No unexplained numeric score</gate>
<gate>Product relevance explicit</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Give bounded heuristic critique when target cannot render.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-design-critique/SKILL.md`. Claude Code substitutes
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
