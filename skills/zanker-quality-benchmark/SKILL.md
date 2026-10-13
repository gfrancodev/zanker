---
name: zanker-quality-benchmark
description: Evaluate Zanker with reproducible UX/UI tasks across frameworks and scenarios. Use for benchmark, release gate, quality comparison.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-quality-benchmark">

<purpose>
Quality Benchmark. Decide whether this is good enough to ship, against declared criteria.

<why_this_matters>
A release gate without written criteria becomes whoever is loudest in the room.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>benchmark</trigger>
<trigger>release gate</trigger>
<trigger>quality comparison</trigger>
</triggers>
<not_for>
Not for a structural review of one page - use `zanker-design-audit`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>quality-gates</pack>
<pack>governance</pack>
</knowledge>

<process>
<step n="1">Select representative tasks: broken mobile modal, form error, dashboard redesign, new marketing page, shared component regression.</step>
<step n="2">Prepare fixed fixture, source baseline, rubric and screenshot configuration.</step>
<step n="3">Have human judge independently score product suitability, visuals, usability and maintainability.</step>
<step n="4">Compare failure rates and regressions across agent revisions, not only average aesthetic score.</step>
</process>

<deliverables>
<deliverable>Benchmark report</deliverable>
<deliverable>Release readiness</deliverable>
</deliverables>

<acceptance_gates>
<gate>Blind or independent review</gate>
<gate>All claims backed by test results</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Use small curated task suite and mark low statistical confidence.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-quality-benchmark/SKILL.md`. Claude Code substitutes
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
