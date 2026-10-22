---
name: zanker-design-tokens
description: Map, author and validate semantic design tokens while preserving existing brand contracts. Use for theme changes, whitelabel, token migration.
metadata:
  author: zanker
  version: "1.1.0"
---

<skill name="zanker-design-tokens">

<purpose>
Design Tokens. Make theming a token change rather than a code change.

<why_this_matters>
Values hardcoded at the component level are why whitelabel and dark mode become rewrites instead of configuration.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>theme changes</trigger>
<trigger>whitelabel</trigger>
<trigger>token migration</trigger>
</triggers>
<not_for>
Not for finding out what the design system is - use `zanker-design-system-discovery`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>design-tokens</pack>
<pack>color-systems</pack>
<pack>typography</pack>
<pack>material-fluent-carbon</pack>
</knowledge>

<process>
<step n="1">When the user requested a new system or supplied a reference image, read `.zanker/design-intelligence/` first. Inspect raw scales and semantic aliases.</step>
<step n="2">Map proposed decisions to existing tokens before defining new ones.</step>
<step n="3">Check light/dark/high contrast/brand variants.</step>
<step n="4">Limit global token changes; enumerate affected consumers and write migration note.</step>
</process>

<deliverables>
<deliverable>Token proposal</deliverable>
<deliverable>Consumer impact list</deliverable>
</deliverables>

<acceptance_gates>
<gate>No hardcoded magic colors without reason</gate>
<gate>Theme parity evidenced</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Do not mutate tokens; propose scoped CSS when ownership unclear.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-design-tokens/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
