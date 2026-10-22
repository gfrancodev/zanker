---
name: zanker-design-decisions
description: Record visual alternatives, rationale, approvals, failures and evidence for future sessions. Use for user approval, decision memory, follow-up revision.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-design-decisions">

<purpose>
Design Decisions. Record what was decided, by whom, and on what evidence.

<why_this_matters>
A design decision nobody can reconstruct gets relitigated at the next change, and the second answer rarely matches the first.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>user approval</trigger>
<trigger>decision memory</trigger>
<trigger>follow-up revision</trigger>
</triggers>
<not_for>
Not for authoring a knowledge-pack rule - use `zanker-reference-curation`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>governance</pack>
<pack>quality-gates</pack>
</knowledge>

<process>
<step n="1">Read existing studio event log and product context.</step>
<step n="2">Create an append-only decision record with scope, context, alternatives, evidence and selection.</step>
<step n="3">Store relative source and screenshot references, without private user data.</step>
<step n="4">Do not replace new user requirements with old preference; detect contradictory decisions.</step>
</process>

<deliverables>
<deliverable>Decisions JSONL</deliverable>
<deliverable>Decision rationale</deliverable>
</deliverables>

<acceptance_gates>
<gate>Provenance and date present</gate>
<gate>No fabricated user approval</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Store pending recommendation without labeling it approved.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-design-decisions/SKILL.md`. Claude Code substitutes
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
