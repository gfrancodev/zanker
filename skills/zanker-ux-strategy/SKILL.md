---
name: zanker-ux-strategy
description: Translate audience and goals into task flows, hierarchy and design decisions. Use when the audience is already known and the work is the product problem or the end-to-end flow, including an onboarding sequence.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-ux-strategy">

<purpose>
Ux Strategy. Frame the product problem and the flow before any screen exists.

<why_this_matters>
Solving the wrong problem beautifully is the most expensive outcome available.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>product problem</trigger>
<trigger>user flow</trigger>
<trigger>onboarding</trigger>
<trigger>end-to-end flow</trigger>
</triggers>
<not_for>
Not for establishing who the audience is in the first place - use `zanker-product-discovery`. Not for menu labels and grouping - use `zanker-information-architecture`. Not for the sentences on the screen - use `zanker-content-design`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>product-discovery</pack>
<pack>information-architecture</pack>
<pack>ai-product-ux</pack>
<pack>ux-research</pack>
</knowledge>

<process>
<step n="1">Define actor, entry point, primary success path, exception states and high-impact actions.</step>
<step n="2">Map steps and remove needless decisions; preserve discoverable critical information.</step>
<step n="3">Express design principles aligned with product stage and audience.</step>
<step n="4">Agree acceptance measures before prototyping.</step>
</process>

<deliverables>
<deliverable>Flow outline</deliverable>
<deliverable>UX intent contract</deliverable>
</deliverables>

<acceptance_gates>
<gate>Path exists for recovery from errors</gate>
<gate>Metrics are associated with user outcomes</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Document a minimal decision flow rather than inventing user evidence.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-ux-strategy/SKILL.md`. Claude Code substitutes
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
