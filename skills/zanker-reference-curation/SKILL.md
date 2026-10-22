---
name: zanker-reference-curation
description: Maintain trustworthy, attributable JSON knowledge without scraping proprietary courses. Use for update references, new UI guideline, knowledge authoring.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-reference-curation">

<purpose>
Reference Curation. Add or update knowledge with sources, licenses and verification dates attached.

<why_this_matters>
Guidance without a verifiable source and a date becomes confidently wrong as the platform moves.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>update references</trigger>
<trigger>new UI guideline</trigger>
<trigger>knowledge authoring</trigger>
</triggers>
<not_for>
Not for recording a product approval - use `zanker-design-decisions`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>governance</pack>
<pack>ux-research</pack>
</knowledge>

<process>
<step n="1">Locate the official primary reference and read applicable scope.</step>
<step n="2">Write concise original operational rule with source URL, limitations, antipattern and acceptance.</step>
<step n="3">Add record to relevant JSON pack, update index and run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/`.</step>
<step n="4">Do not copy paid courses or protected third-party source into redistributed package.</step>
</process>

<deliverables>
<deliverable>Curated JSON rule</deliverable>
<deliverable>Source provenance</deliverable>
</deliverables>

<acceptance_gates>
<gate>Source is attributable</gate>
<gate>No unsupported normative claims</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Mark source as unverified and omit hard requirements until checked.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-reference-curation/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/knowledge.schema.json</schema>
<index>${CLAUDE_PLUGIN_ROOT}/knowledge/index.json</index>
</contracts>
</resources>

</skill>
