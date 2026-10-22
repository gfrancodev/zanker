---
name: zanker-accessibility-audit
description: Audit semantic controls, keyboard interaction, contrast and WCAG-related requirements. Use for WCAG, a11y, accessible forms, keyboard.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-accessibility-audit">

<purpose>
Accessibility Audit. Map interface defects to the exact WCAG success criteria they violate, so fixes target a standard instead of an opinion.

<why_this_matters>
Automated rules find a minority of real barriers; the rest need keyboard and assistive-tech testing a tool cannot replace.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>WCAG</trigger>
<trigger>a11y</trigger>
<trigger>accessible forms</trigger>
<trigger>keyboard</trigger>
</triggers>
<not_for>
Not for general visual quality review - use `zanker-design-audit`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>components-states</pack>
<pack>forms-validation</pack>
<pack>quality-gates</pack>
<pack>web-design</pack>
</knowledge>

<process>
<step n="1">Run available automated accessibility tools such as @axe-core/playwright if project has them.</step>
<step n="2">Inspect labels, focus, keyboard flow, reduced motion, error feedback and status announcements.</step>
<step n="3">Map findings to exact WCAG 2.2 success criteria where appropriate.</step>
<step n="4">State what automated checks cannot verify and require manual/assistive-tech testing.</step>
</process>

<deliverables>
<deliverable>Accessibility report</deliverable>
<deliverable>Reproduction steps</deliverable>
</deliverables>

<acceptance_gates>
<gate>No claims of total WCAG compliance from automation</gate>
<gate>Issue severity explained</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Provide manual test checklist and mark untested cases.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-accessibility-audit/SKILL.md`. Claude Code substitutes
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
