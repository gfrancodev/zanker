---
name: zanker-motion-design
description: Design purposeful CSS/Motion/GSAP animation with reduced-motion equivalents. Use for animation, microinteraction, transitions, interactive motion.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-motion-design">

<purpose>
Motion Design. Use motion to explain state change, not to decorate.

<why_this_matters>
Animation that does not clarify a transition costs frame budget and, for motion-sensitive users, accessibility.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>animation</trigger>
<trigger>microinteraction</trigger>
<trigger>transitions</trigger>
<trigger>interactive motion</trigger>
</triggers>
<not_for>
Not for a page that is already slow or for heavy existing animation - use `zanker-performance-audit`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>motion-design</pack>
<pack>performance</pack>
</knowledge>

<process>
<step n="1">Explain state change or spatial relationship communicated by motion.</step>
<step n="2">Choose native CSS for simple transitions, framework library for interaction, advanced runtime only when justified.</step>
<step n="3">Check Zanker motion presets the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/`; generate tokens via the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` if desired.</step>
<step n="4">Test prefers-reduced-motion, focus behavior, exit timing and runtime performance.</step>
</process>

<deliverables>
<deliverable>Motion intent and timing</deliverable>
<deliverable>Motion CSS or component animation</deliverable>
</deliverables>

<acceptance_gates>
<gate>Animation aids task</gate>
<gate>Reduced-motion works</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Offer a static transition or simpler state feedback.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-motion-design/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
