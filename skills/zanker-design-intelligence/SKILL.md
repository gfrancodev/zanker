---
name: zanker-design-intelligence
description: Run design-system generation, reference lookup, page-graph context, and component-catalog search when visual direction is open or the user requests a new system. Use for design system from reference, visual brief, catalog search.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-design-intelligence">

<purpose>
Design Intelligence. Turn open visual decisions into a brief the implementation skills can execute, using vendored catalog search, reference sites, the project page graph, and user-delivered images.

<why_this_matters>
Without a grounded brief, art direction falls back to model defaults. This skill forces every color, type, and section choice to cite a source rank.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>design system</trigger>
<trigger>visual reference</trigger>
<trigger>open visual direction</trigger>
<trigger>component catalog</trigger>
</triggers>
<not_for>
Not for patching a single visual bug - use `zanker-visual-forensics`. Not for studio brainstorming when the user already attached a reference image.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>color-systems</pack>
<pack>typography</pack>
<pack>visual-hierarchy</pack>
<pack>design-tokens</pack>
</knowledge>

<process>
<step n="1">Run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/inspect.sh --project <absolute path>` when `.zanker/page-graph.json` is missing or stale.</step>
<step n="2">When the user supplied an image or screenshot, read it, write `.zanker/design-intelligence/<slug>.md` with visible sections, density, color roles, type character, and inventory components seen. Skip Studio and skip asking which palette to pick. Label catalog-only assumptions separately.</step>
<step n="3">Without a user image, run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/design-search.sh --project <path> --query "..." --design-system --json -p "<name>"` and `bash ${CLAUDE_PLUGIN_ROOT}/scripts/reference-search.sh --project <path> --query "..."`. Merge results into the same brief file. If python3 is missing, say so and use knowledge packs only.</step>
<step n="4">For component or full-system requests, run `bash ${CLAUDE_PLUGIN_ROOT}/scripts/component-search.sh --project <path> --query "..."` and hand off to `zanker-design-tokens` then `zanker-component-design` in dependency order.</step>
</process>

<deliverables>
<deliverable>`.zanker/design-intelligence/` brief</deliverable>
<deliverable>Reference site fichas with URL and reason</deliverable>
<deliverable>Component catalog matches with dependencies</deliverable>
</deliverables>

<acceptance_gates>
<gate>User visual reference outranks catalog output</gate>
<gate>Page graph sections are not replaced when the code already defines them</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
When design-search cannot run, document the gap and proceed with knowledge packs and explicit assumptions.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth unless the user explicitly requests a new system.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
<invariant>Do not mirror third-party sites with wget, curl recursion, or HTML/CSS copying.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-design-intelligence/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
