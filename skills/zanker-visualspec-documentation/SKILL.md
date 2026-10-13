---
name: zanker-visualspec-documentation
description: Document already-created or conceptual visuals using Visual Spec as a reference only, never code generation. Use for visualspec, visual documentation, screenshot reference.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-visualspec-documentation">

<purpose>
Visualspec Documentation. Register visual documentation that points back to the real source.

<why_this_matters>
Documentation that drifts from the code is worse than none, because it is trusted.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>visualspec</trigger>
<trigger>visual documentation</trigger>
<trigger>screenshot reference</trigger>
</triggers>
<not_for>
Not for judging whether a screen reads as considered - use `zanker-design-critique`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>quality-gates</pack>
<pack>governance</pack>
</knowledge>

<process>
<step n="1">Inspect real code/screenshot as the implementation source of truth.</step>
<step n="2">Use https://visualspec.dev/specification/1.0 as documentation guidance; only author a spec document if schema is verified separately.</step>
<step n="3">Run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` to register reference.</step>
<step n="4">Mark conceptual vs implemented and link source files and evidence.</step>
<step n="5">Never take the Visual Spec JSON and generate, modify or reconstruct executable UI from it.</step>
</process>

<deliverables>
<deliverable>.zanker/documentation/.../document.json</deliverable>
<deliverable>VisualSpec reference if supplied</deliverable>
</deliverables>

<acceptance_gates>
<gate>Visual Spec never implementation source</gate>
<gate>Mark unverified schema rather than claiming conformance</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Document screenshots and source links; omit unverified Visual Spec attachment.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-visualspec-documentation/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
