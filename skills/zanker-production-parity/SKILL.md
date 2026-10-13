---
name: zanker-production-parity
description: Verify isolated preview matches actual integrated application. Use for sandbox mismatch, SSR, production readiness.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-production-parity">

<purpose>
Production Parity. State honestly how far the sandbox is from production.

<why_this_matters>
A result validated in a sandbox that differs from production is not validated, and silent parity gaps are how regressions reach users.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>sandbox mismatch</trigger>
<trigger>SSR</trigger>
<trigger>production readiness</trigger>
</triggers>
<not_for>
Not for creating the isolated render - use `zanker-stack-sandbox`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>frontend-architecture</pack>
<pack>quality-gates</pack>
</knowledge>

<process>
<step n="1">List sandbox shims, mocked providers, styles and runtime limitations.</step>
<step n="2">Reproduce in the target framework native server/route when feasible.</step>
<step n="3">Compare shared state, fonts, global CSS, SSR output, hydration and user permissions.</step>
<step n="4">Flag unverified cases and prevent signoff as production-equivalent.</step>
</process>

<deliverables>
<deliverable>Parity checklist</deliverable>
<deliverable>Integrated screenshots</deliverable>
</deliverables>

<acceptance_gates>
<gate>Mocked dependencies recorded</gate>
<gate>No claim of parity without evidence</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Mark integrated validation pending.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-production-parity/SKILL.md`. Claude Code substitutes
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
