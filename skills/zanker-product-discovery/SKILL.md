---
name: zanker-product-discovery
description: Discover product goals, users, jobs and evidence before redesigning a screen. Use for new page, redesign, unclear audience.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-product-discovery">

<purpose>
Product Discovery. Establish who this is for and what they are trying to finish, before designing.

<why_this_matters>
Interface decisions are unanswerable without a user task; without one, taste substitutes for judgment.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>new page</trigger>
<trigger>redesign</trigger>
<trigger>unclear audience</trigger>
</triggers>
<not_for>
Not for framing the flow once the audience is already known - use `zanker-ux-strategy`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>product-discovery</pack>
<pack>ux-research</pack>
</knowledge>

<process>
<step n="1">Inspect product docs, language strings, route names and existing analytics definitions without assuming these prove user motivations.</step>
<step n="2">Produce facts, hypotheses and unknowns separately; identify primary user task and success metric.</step>
<step n="3">Ask only questions whose answers materially change user experience or risk.</step>
<step n="4">Record a concise product.context.json and reference sources.</step>
</process>

<deliverables>
<deliverable>.zanker/product.context.json</deliverable>
<deliverable>Primary user outcome and evidence confidence</deliverable>
</deliverables>

<acceptance_gates>
<gate>Never assert user research happened unless it did</gate>
<gate>Distinguish user needs from stakeholder requests</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Use explicit hypotheses and document missing evidence.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-product-discovery/SKILL.md`. Claude Code substitutes
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
