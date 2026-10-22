---
name: zanker-visual-forensics
description: Reproduce a visual defect, isolate root cause, apply the smallest appropriate fix and verify. Use when one screenshot disagrees with the intended pixels and the cause must be measured.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-visual-forensics">

<purpose>
Visual Forensics. Explain a pixel-level mismatch with measured evidence.

<why_this_matters>
Guessing at a layout defect from a screenshot produces plausible fixes that do not hold.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>screenshot mismatch</trigger>
<trigger>overflow</trigger>
<trigger>misalignment</trigger>
<trigger>typography clipping</trigger>
</triggers>
<not_for>
Not for locating which rule produces a defect in the first place - use `zanker-frontend-inspection`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>frontend-architecture</pack>
<pack>layout-responsive</pack>
<pack>quality-gates</pack>
</knowledge>

<process>
<step n="1">Record viewport, state, reproduction path and original screenshot.</step>
<step n="2">Use `bash ${CLAUDE_PLUGIN_ROOT}/scripts/diagnose.sh` and `bash ${CLAUDE_PLUGIN_ROOT}/scripts/audit.sh` for browser evidence where available.</step>
<step n="3">Form two or more hypotheses, test one variable at a time, trace shared component usage.</step>
<step n="4">Apply minimal patch in worktree; compare before/after and verify neighboring layouts.</step>
</process>

<deliverables>
<deliverable>Cause and evidence</deliverable>
<deliverable>Before/after screenshots</deliverable>
<deliverable>Reproducible fix</deliverable>
</deliverables>

<acceptance_gates>
<gate>Explain what caused the problem</gate>
<gate>No unrelated redesign</gate>
<gate>Affected shared components checked</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Supply hypothesis plus a concrete reproducible browser check; do not pretend certainty.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-visual-forensics/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
