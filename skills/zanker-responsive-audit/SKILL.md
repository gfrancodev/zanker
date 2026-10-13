---
name: zanker-responsive-audit
description: Review viewport, container, zoom, long content and touch usability. Use when checking a layout across mobile, tablet, and desktop for the first time.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-responsive-audit">

<purpose>
Responsive Audit. Verify the layout across viewports and input methods, not just the one you designed in.

<why_this_matters>
Most layout defects live at widths nobody opened during design.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>mobile issue</trigger>
<trigger>tablet</trigger>
<trigger>layout overflow</trigger>
</triggers>
<not_for>
Not for comparing before and after a change - use `zanker-visual-regression`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>layout-responsive</pack>
<pack>quality-gates</pack>
</knowledge>

<process>
<step n="1">Audit widths 375,768,1440 and add relevant breakpoint edges.</step>
<step n="2">Inspect horizontal overflow, clipped controls, keyboard overlays and long text.</step>
<step n="3">Check reusable components at different container widths.</step>
<step n="4">Retest after changes and provide screenshots.</step>
</process>

<deliverables>
<deliverable>Viewport screenshots</deliverable>
<deliverable>Responsive defects</deliverable>
</deliverables>

<acceptance_gates>
<gate>Main task remains usable</gate>
<gate>No horizontal overflow</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Use browser responsive devtools when Playwright missing.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-responsive-audit/SKILL.md`. Claude Code substitutes
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
