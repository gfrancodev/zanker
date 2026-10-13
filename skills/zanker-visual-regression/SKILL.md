---
name: zanker-visual-regression
description: Capture deterministic browser screenshots and review meaningful changes. Use when proving which pixels changed between two captures of the same UI.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-visual-regression">

<purpose>
Visual Regression. Prove what changed visually between two states.

<why_this_matters>
Unintended visual change is invisible to unit tests and obvious to users.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>pixel regression</trigger>
<trigger>compare before-after</trigger>
<trigger>responsive screenshots</trigger>
</triggers>
<not_for>
Not for checking a layout across viewports for the first time - use `zanker-responsive-audit`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>quality-gates</pack>
<pack>layout-responsive</pack>
</knowledge>

<process>
<step n="1">Use stable font, browser version, device scale and fixtures.</step>
<step n="2">Run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` and capture screenshots.</step>
<step n="3">Compare artifacts to approved references; classify intentional vs unintentional changes.</step>
<step n="4">Never auto-approve a baseline solely to make tests green.</step>
</process>

<deliverables>
<deliverable>Screenshots</deliverable>
<deliverable>Review notes</deliverable>
</deliverables>

<acceptance_gates>
<gate>Browser environment recorded</gate>
<gate>Affected state coverage</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Save screenshots for manual compare when pixel tooling absent.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-visual-regression/SKILL.md`. Claude Code substitutes
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
