---
name: zanker-root-cause-analysis
description: Trace visual defects to the responsible style, component state or runtime context. Use for persistent UI bug, regression, inconsistent render.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-root-cause-analysis">

<purpose>
Root Cause Analysis. Find the cause of a bug that keeps coming back.

<why_this_matters>
A defect that returns was never fixed; it was hidden, usually by an override that is still in the codebase.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>persistent UI bug</trigger>
<trigger>regression</trigger>
<trigger>inconsistent render</trigger>
</triggers>
<not_for>
Not for a first-contact diagnosis of an unfamiliar repository - use `zanker-project-dna`.
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
<step n="1">Record the smallest failing scenario.</step>
<step n="2">Inspect cascade, inherited styles, font loading, intrinsic sizes, layout container and viewport.</step>
<step n="3">Differentiate implementation defect from sandbox mismatch.</step>
<step n="4">Fix at correct abstraction layer, then test related consumers.</step>
</process>

<deliverables>
<deliverable>Root-cause note</deliverable>
<deliverable>Regression test suggestion</deliverable>
</deliverables>

<acceptance_gates>
<gate>Avoid CSS !important band-aids</gate>
<gate>Record unresolved uncertainty</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Escalate to integrated-mode reproduction if sandbox lacks parity.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-root-cause-analysis/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
