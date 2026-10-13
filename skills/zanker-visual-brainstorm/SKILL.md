---
name: zanker-visual-brainstorm
description: Serve multiple design explorations and collect user selections locally. Use when two or three genuinely different UI directions must exist before anyone commits.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-visual-brainstorm">

<purpose>
Visual Brainstorm. Produce genuinely different options, not variations of one idea.

<why_this_matters>
Three near-identical options are a single proposal wearing a disguise, and they make approval meaningless.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>compare UI ideas</trigger>
<trigger>visual companion</trigger>
<trigger>visual brainstorming</trigger>
</triggers>
<not_for>
Not for committing to one direction and detailing it - use `zanker-art-direction`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>visual-hierarchy</pack>
<pack>product-discovery</pack>
</knowledge>

<process>
<step n="1">Create a concepts.json with 2-3 visual directions; HTML/CSS concepts allowed.</step>
<step n="2">Run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/`.</step>
<step n="3">User opens URL and selects or comments; inspect .zanker/studio/events-*.jsonl.</step>
<step n="4">Translate approved direction into implementation plan; concepts are not production code.</step>
</process>

<deliverables>
<deliverable>concepts.json</deliverable>
<deliverable>Choice and feedback events</deliverable>
</deliverables>

<acceptance_gates>
<gate>Concepts differ substantively</gate>
<gate>Approval captured before major redesign</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Render static alternatives or image references if interactive preview unavailable.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-visual-brainstorm/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/concept.schema.json</schema>
</contracts>
</resources>

</skill>
