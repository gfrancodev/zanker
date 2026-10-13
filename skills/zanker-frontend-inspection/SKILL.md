---
name: zanker-frontend-inspection
description: Map runtime UI elements to DOM, computed styles, component files and dependencies. Use for broken component, locate element, CSS diagnosis.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-frontend-inspection">

<purpose>
Frontend Inspection. Locate the element and the rule actually producing a visual defect.

<why_this_matters>
Patching the symptom you can see leaves the cause in place, and it resurfaces in the next component that uses the same rule.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>broken component</trigger>
<trigger>locate element</trigger>
<trigger>CSS diagnosis</trigger>
</triggers>
<not_for>
Not for a defect that keeps returning after being fixed - use `zanker-root-cause-analysis`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>frontend-architecture</pack>
<pack>layout-responsive</pack>
<pack>web-design</pack>
</knowledge>

<process>
<step n="1">Inspect relevant code and find the entrypoint; use component name or route to narrow scope.</step>
<step n="2">If a local app is running, use the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` to capture computed layout.</step>
<step n="3">Compare browser evidence with CSS selectors, imports and shared token definitions.</step>
<step n="4">Record source candidates; do not claim precise source map where unavailable.</step>
</process>

<deliverables>
<deliverable>DOM/CSS diagnosis</deliverable>
<deliverable>Suspected source files</deliverable>
</deliverables>

<acceptance_gates>
<gate>Evidence accompanies hypotheses</gate>
<gate>No blind global overrides</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
If Playwright is absent, use static code inspection and mark browser validation pending.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-frontend-inspection/SKILL.md`. Claude Code substitutes
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
