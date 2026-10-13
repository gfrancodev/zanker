---
description: Delegate a frontend UX/UI task to Zanker's product-aware design and visual engineering workflow.
argument-hint: [task description]
---

<task>
$ARGUMENTS
</task>

<instructions>
Handle the task above with the `zanker` subagent when your host exposes it. Otherwise load
`${CLAUDE_PLUGIN_ROOT}/agents/zanker.md` and follow its `<process>` and `<skill_router>` directly.

Before acting, match `<task>` to one `<route>` and load only that skill from
`${CLAUDE_PLUGIN_ROOT}/skills/<name>/SKILL.md`. The skill then consults
`${CLAUDE_PLUGIN_ROOT}/rules/zanker.mdc` and loads the knowledge packs, schemas, and templates it
names. Do not paste all 130 knowledge rules into context.

If `<task>` is empty, ask what the user wants built, diagnosed or reviewed before doing anything else.

Start from project and product context, never from a blank page: run `inspect.sh`, read the nearest
sibling screen or component, and establish the real content shape before proposing any design.

Visual Spec is documentation/reference ONLY and is never an input to code generation.
</instructions>
