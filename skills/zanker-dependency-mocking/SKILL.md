---
name: zanker-dependency-mocking
description: Supply deterministic providers and mock APIs to reproduce component behavior without production services. Use for auth provider, API down, complex page sandbox.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-dependency-mocking">

<purpose>
Dependency Mocking. Render a component whose real dependencies are unavailable.

<why_this_matters>
Waiting on a backend or auth provider to review a visual change wastes the cheapest iteration loop available.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>auth provider</trigger>
<trigger>API down</trigger>
<trigger>complex page sandbox</trigger>
</triggers>
<not_for>
Not for designing the fixture data itself - use `zanker-scenario-engine`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>frontend-architecture</pack>
<pack>components-states</pack>
</knowledge>

<process>
<step n="1">Identify runtime dependencies before attempting mock.</step>
<step n="2">Prefer adapting existing DI/providers, Storybook decorators or MSW handlers.</step>
<step n="3">Use synthetic fixtures and explicit roles, flags and locales.</step>
<step n="4">Record mocked dependencies and validate with integrated runtime before claiming parity.</step>
</process>

<deliverables>
<deliverable>Mock adapters</deliverable>
<deliverable>Parity disclosure</deliverable>
</deliverables>

<acceptance_gates>
<gate>No production credentials</gate>
<gate>Mock semantics documented</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Use native project dev environment if provider cannot be safely simulated.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-dependency-mocking/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
<schema>${CLAUDE_PLUGIN_ROOT}/schemas/scenario.schema.json</schema>
</contracts>
</resources>

</skill>
