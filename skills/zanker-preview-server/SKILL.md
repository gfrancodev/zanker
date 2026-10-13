---
name: zanker-preview-server
description: Launch a local studio to present visual options and capture approvals. Use when visual alternatives are already prepared and a person must choose on a local URL.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-preview-server">

<purpose>
Preview Server. Put visual alternatives in front of a human and capture the choice.

<why_this_matters>
Design disagreements resolve in seconds when both options are on screen, and in days when they are described in prose.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>visual companion</trigger>
<trigger>compare mockups</trigger>
<trigger>design preview</trigger>
</triggers>
<not_for>
Not for rendering one real component in the project stack - use `zanker-stack-sandbox`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>visual-hierarchy</pack>
<pack>quality-gates</pack>
</knowledge>

<process>
<step n="1">Prepare the concepts file so it validates against `${CLAUDE_PLUGIN_ROOT}/schemas/concept.schema.json`.</step>
<step n="2">Run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` (default binds loopback and generates session token).</step>
<step n="3">Share local URL with project owner; inspect saved feedback events.</step>
<step n="4">Shut down server when finished; do not expose it publicly.</step>
</process>

<deliverables>
<deliverable>Local preview URL</deliverable>
<deliverable>JSONL events</deliverable>
</deliverables>

<acceptance_gates>
<gate>No production modifications</gate>
<gate>Selection and feedback recorded</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Present HTML mockups or screenshot set without server.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-preview-server/SKILL.md`. Claude Code substitutes
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
