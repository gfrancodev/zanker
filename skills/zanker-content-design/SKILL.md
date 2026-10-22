---
name: zanker-content-design
description: Design UI microcopy, errors, empty states and translations consistent with user tasks. Use when the words must change: form labels, onboarding copy, error messages, or translations.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-content-design">

<purpose>
Content Design. Make the words carry the interface, across locales.

<why_this_matters>
Copy is read before anything else is understood, and translated strings routinely run 40% longer than the English they replace.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>form copy</trigger>
<trigger>onboarding copy</trigger>
<trigger>error messages</trigger>
<trigger>localized product</trigger>
</triggers>
<not_for>
Not for the flow those words sit in - use `zanker-ux-strategy`. Not for menu grouping - use `zanker-information-architecture`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>localization</pack>
<pack>forms-validation</pack>
<pack>ai-product-ux</pack>
<pack>product-discovery</pack>
</knowledge>

<process>
<step n="1">Identify user vocabulary, decision impact and content goal.</step>
<step n="2">Write labels and actionable error/recovery texts; avoid placeholder-only inputs.</step>
<step n="3">Test long translations, accents, currency and date formats.</step>
<step n="4">Review content with product stakeholders or users when stakes are meaningful.</step>
</process>

<deliverables>
<deliverable>Copy deck</deliverable>
<deliverable>Localization constraints</deliverable>
</deliverables>

<acceptance_gates>
<gate>Plain language</gate>
<gate>Important content not truncated</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
<gate>No em-dash used as a connector anywhere in the copy, and no ellipsis character.</gate>
</acceptance_gates>

<fallback>
Mark sensitive language for human review.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-content-design/SKILL.md`. Claude Code substitutes
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
