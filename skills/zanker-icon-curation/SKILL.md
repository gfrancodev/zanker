---
name: zanker-icon-curation
description: Select semantically correct icons with coherent family/weight and license metadata. Use for change icons, repeated icon problem, navigation iconography.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-icon-curation">

<purpose>
Icon Curation. Keep an icon set semantically and visually coherent, with licensing known.

<why_this_matters>
Mixed icon families read as carelessness faster than almost any other inconsistency, and unlicensed icons are a legal problem, not a design one.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>change icons</trigger>
<trigger>repeated icon problem</trigger>
<trigger>navigation iconography</trigger>
</triggers>
<not_for>
Not for illustrations, heroes, or banners - use `zanker-media-generation`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>iconography</pack>
<pack>components-states</pack>
</knowledge>

<process>
<step n="1">Inventory project icon library and existing semantic mappings.</step>
<step n="2">Run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/icons.sh --query analytics` to get cross-family candidates.</step>
<step n="3">Choose single dominant visual grammar; evaluate meaning, recognition and accessible names.</step>
<step n="4">Add source/license metadata; replace icons only when they improve meaning or consistency.</step>
</process>

<deliverables>
<deliverable>Icon decision map</deliverable>
<deliverable>Selected icon IDs</deliverable>
</deliverables>

<acceptance_gates>
<gate>No arbitrary novelty</gate>
<gate>No icon-only button without accessible name</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Describe candidate glyph in words and preserve project library.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-icon-curation/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
