---
name: zanker-art-direction
description: Develop distinctive, product-appropriate visual direction grounded in the user context. Use for new interface, premium visual, landing page, branding.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-art-direction">

<purpose>
Art Direction. Give an interface a deliberate visual point of view instead of a default one.

<why_this_matters>
Without a committed direction every choice falls back to the most average option available, which is exactly what reads as AI-generated.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>new interface</trigger>
<trigger>premium visual</trigger>
<trigger>landing page</trigger>
<trigger>branding</trigger>
</triggers>
<not_for>
Not for generating several distinct options to compare - use `zanker-visual-brainstorm`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>visual-hierarchy</pack>
<pack>typography</pack>
<pack>color-systems</pack>
</knowledge>

<process>
<step n="1">Load `zanker-design-intelligence` when direction is still open. Read `.zanker/page-graph.json` and Product DNA.</step>
<step n="2">With a user reference image: extract the brief into `.zanker/design-intelligence/`, then choose type, palette, density, imagery and motion from what is visible. Do not open Studio.</step>
<step n="3">Without a user image: run design-search and reference-search, then formulate art direction as an explicit sentence. Studio is optional, not required.</step>
<step n="4">Avoid default identical card grids, violet gradients and decorative noise without justification.</step>
</process>

<deliverables>
<deliverable>Direction statement</deliverable>
<deliverable>Concept alternatives and rationale</deliverable>
</deliverables>

<acceptance_gates>
<gate>Product suitability beats trend following</gate>
<gate>Contrast and clarity are maintained</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
If no product context exists, show assumptions with alternatives.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-art-direction/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/product.schema.json</schema>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/concept.schema.json</schema>
<template>${CLAUDE_PLUGIN_ROOT}/templates/product.context.json</template>
</contracts>
</resources>

</skill>
