---
name: zanker-media-generation
description: Create and optimize SVG/raster media with provenance and explicit project purpose. Use for illustration, hero art, banner, media.
metadata:
  author: zanker
  version: "1.0.0"
---

<skill name="zanker-media-generation">

<purpose>
Media Generation. Produce or source imagery that belongs to this product.

<why_this_matters>
Generic stock and generated filler undercut an otherwise considered interface, and license provenance has to be known before anything ships.
</why_this_matters>
</purpose>

<when_to_use>
<triggers>
<trigger>illustration</trigger>
<trigger>hero art</trigger>
<trigger>banner</trigger>
<trigger>media</trigger>
</triggers>
<not_for>
Not for choosing or replacing icons - use `zanker-icon-curation`.
</not_for>
</when_to_use>

<knowledge>
Read `${CLAUDE_PLUGIN_ROOT}/knowledge/index.json` first, then load from
`${CLAUDE_PLUGIN_ROOT}/knowledge/` only the packs named below. Never paste the whole corpus
into context, and read the project manifest before proposing any implementation change.

<pack>media-production</pack>
<pack>visual-hierarchy</pack>
</knowledge>

<process>
<step n="1">Specify art purpose, dimensions, platform, license requirements, alt text and style.</step>
<step n="2">For simple original SVG run the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/`.</step>
<step n="3">For raster use an authorized image-generation provider, then optimize with the applicable script in `${CLAUDE_PLUGIN_ROOT}/scripts/` if Sharp installed.</step>
<step n="4">Record source/provider, license, final dimensions and visual review; do not fabricate media generation when provider unavailable.</step>
</process>

<deliverables>
<deliverable>Asset files</deliverable>
<deliverable>Asset manifest and alt text</deliverable>
</deliverables>

<acceptance_gates>
<gate>No unlicensed assets</gate>
<gate>Optimized and visually validated</gate>
<gate>Every claim of a check that ran is backed by evidence you can point to.</gate>
</acceptance_gates>

<fallback>
Use procedural SVG or a documented asset brief when no image provider exists.
</fallback>

<invariants>
<invariant>Code and project design system remain implementation source of truth.</invariant>
<invariant>Visual Spec is documentation/reference ONLY, never code generation input.</invariant>
<invariant>Do not invent product research, visual-test outcomes or browser screenshots.</invariant>
<invariant>Third-party repositories are references; never bundle their code without compatible license and attribution.</invariant>
</invariants>

<resources>
This skill lives at `${CLAUDE_PLUGIN_ROOT}/skills/zanker-media-generation/SKILL.md`. Claude Code substitutes
`${CLAUDE_PLUGIN_ROOT}` with the real install path when it loads this file, so use these paths
literally. Scripts are at `${CLAUDE_PLUGIN_ROOT}/scripts/` (PowerShell twins in `scripts/windows/`)
and always take `--project <absolute path>` pointing at the user's repository. On Cursor the
variable is `${CURSOR_PLUGIN_ROOT}`. There is no global Zanker CLI.
<contracts>
<rule>Apply `${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` (anti-slop, existing system first, evidence). The agent already carries that rule. Do not paste it again, and do not paste all 130 knowledge rules into context.</rule>
</contracts>
</resources>

</skill>
