---
name: zanker-safe-patching
description: Apply smallest reasonable frontend change and produce reviewable integration evidence. Use for implement approved design, fix bug, PR.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-safe-patching">

<purpose>
Safe Patching. Apply an approved change with the smallest possible blast radius.

<why_this_matters>
A broad change made to fix a narrow problem is how one bug becomes three.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>implement approved design</trigger>
<trigger>fix bug</trigger>
<trigger>PR</trigger>
</triggers>
<not_for>
Not for deciding what the change should be - use the skill for that task class first.
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
<step n="1">Prefer git worktree or isolated branch; preserve existing source and conventions.</step>
<step n="2">Summarize exact changed files, potential blast radius and test plan.</step>
<step n="3">Run project tests/build only with user authorization and documented commands.</step>
<step n="4">Deliver patch with before/after, unresolved risks and optional manual approval.</step>
</process>

<deliverables>
<deliverable>Patch/diff</deliverable>
<deliverable>Integration notes</deliverable>
</deliverables>

<acceptance_gates>
<gate>No unreviewed destructive edits</gate>
<gate>Tests appropriately scoped</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Provide proposed diff without applying changes.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-safe-patching/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
