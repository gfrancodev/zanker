---
name: zanker-design-system-discovery
description: Extract and prioritize real project tokens, components and visual conventions. Use when the stack is already known and tokens, type, color, or components must be inventoried.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-design-system-discovery">

<purpose>
Design System Discovery. Find the design system that already exists in the code before proposing anything new.

<why_this_matters>
Most inconsistency is not a missing system but an unread one, and a rebrand built on a wrong reading propagates the error everywhere.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>existing UI</trigger>
<trigger>rebrand</trigger>
<trigger>inconsistent components</trigger>
</triggers>
<not_for>
Not for migrating or renaming tokens once the system is known - use `zanker-design-tokens`. Not for the first scan of an unknown stack - use `zanker-project-dna`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>design-tokens</pack>
<pack>visual-hierarchy</pack>
<pack>typography</pack>
<pack>color-systems</pack>
<pack>apple-guidelines</pack>
<pack>material-fluent-carbon</pack>
</knowledge>

<process>
<step n="1">Read project.manifest.json and key CSS or theme files.</step>
<step n="2">Create a semantic map of typography, color roles, spacing, radius, shadow and motion.</step>
<step n="3">Locate canonical components and note where consuming screens might regress.</step>
<step n="4">Describe discrepancies as proposals; do not overwrite global tokens during analysis.</step>
</process>

<deliverables>
<deliverable>Token map</deliverable>
<deliverable>Reusable component inventory</deliverable>
</deliverables>

<acceptance_gates>
<gate>Design system precedes generic Zanker defaults</gate>
<gate>Global changes require impact review</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Use a provisional token map clearly labeled as inferred.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-design-system-discovery/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/project.schema.json</schema>
</contracts>
</resources>

</skill>
