---
name: zanker-project-dna
description: Inspect an existing frontend repository for framework, styling, design system, routes and shared components. Use when the repository is unknown and the stack must be learned before any change.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-project-dna">

<purpose>
Project Dna. Learn how this specific repository does frontend before touching it.

<why_this_matters>
Code written against assumed conventions gets rejected in review even when it works.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>unknown repository</trigger>
<trigger>learn the stack</trigger>
<trigger>first contact</trigger>
</triggers>
<not_for>
Not for inventorying tokens and components after the stack is known - use `zanker-design-system-discovery`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>frontend-architecture</pack>
<pack>design-tokens</pack>
</knowledge>

<process>
<step n="1">Run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` (read only except generated .zanker manifest).</step>
<step n="2">Review package.json, scripts, global CSS, font assets, token definitions and shared components.</step>
<step n="3">Identify runtime dependencies that an isolated preview must reproduce.</step>
<step n="4">Do not execute package scripts or install dependencies during discovery.</step>
</process>

<deliverables>
<deliverable>.zanker/project.manifest.json</deliverable>
<deliverable>Dependencies and fidelity risks</deliverable>
</deliverables>

<acceptance_gates>
<gate>Reuse project components first</gate>
<gate>Flag uncertain detections</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Inspect manually and document unsupported workspace layouts.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-project-dna/SKILL.md`. Claude Code substitutes
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
