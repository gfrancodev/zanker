<p align="center">
  <img src="assets/logo-rounded.png" alt="Zanker" width="140">
</p>

<h1 align="center">Zanker</h1>

<p align="center">
  <strong>AI product design and visual engineering agent for codebases that already exist.</strong>
</p>

<p align="center">
  <a href="#why-it-exists">Why it exists</a> ·
  <a href="#the-pain">The pain</a> ·
  <a href="#the-thesis">The thesis</a> ·
  <a href="#what-counts-as-truth">What counts as truth</a> ·
  <a href="#worked-examples">Worked examples</a> ·
  <a href="#install">Install</a> ·
  <a href="#honest-limits">Limits</a>
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-1.0.0-1f6feb">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-2ea043">
  <img alt="skills" src="https://img.shields.io/badge/skills-33-0ea5a4">
  <img alt="rules" src="https://img.shields.io/badge/knowledge-130%20rules-8957e5">
</p>

---

## Why it exists

This project comes from being tired of AI-built interfaces that work and still do not care about
UX or UI at all. The screen ships, and it looks like every other screen the model has produced:
purple gradient on white, uniform cards, Inter, a three-column feature grid, a happy path with no
empty state. That is not a model trying to design and failing. It is a model that was never given
design as knowledge it has to apply, so every open choice falls through to the average.

An agent that writes frontend should already have that knowledge. It should read the design system
that is already in the repository, decide what is still genuinely open, structure the screen before
decorating it, and bring evidence of what it rendered. UX and UI are not a coat of paint after the
code. They are part of the job. Zanker is that knowledge, packaged so the agent has to use it.

---

## The pain

Ask any coding agent for a screen and you get something that works and looks like everything else it
has ever produced. Four failures show up again and again.

**1. Every decision falls through to a default.** Purple gradient on white. Uniform cards at uniform
spacing with one shadow value. Inter. Three-column feature grid. None of this is the model trying and
failing. It is the model never being forced to decide, so each choice lands on the most average option
available. Users have a name for the result: AI slop.

**2. It redesigns what was settled and defaults on what mattered.** An agent with no read on the
existing system invents a new button while quietly accepting whatever spacing scale came out of the
template.

**3. "Looks good" with nothing behind it.** No screenshot, no dark mode, no keyboard pass, no empty
state. The happy path at perfect data density, presented as finished.

**4. The tools assume a blank page.** Real frontend work is 90% reading what is already there.

---

## The thesis

One idea runs through the whole design:

> **Quality is not an effort problem. It is a defaults problem.**
> A screen is bad when decisions fall through to defaults nobody chose.

This reframes what an agent is for. Trying harder does not help, because the failure is not a lack of
effort: it is a decision that was never made by anyone, and therefore landed on the statistical
average of everything the model has read. The fix is not more instructions. It is making each decision
have an origin.

| Mechanism | What it does |
| :- | :- |
| **Read the system first** | The nearest sibling screen answers most design questions. Diverging is allowed; diverging silently is not. |
| **Name the residue** | After reading the system and the real content, 2 to 4 decisions are genuinely open. They get stated out loud, so nothing important is decided by accident. |
| **Structure before surface** | One primary action, reading order that survives in grayscale, then colour and type. Inverting this order is how the shiny template happens. |
| **Content before layout** | Longest real string, worst-case row count, empty and partial records. Layout is downstream of content shape. |
| **States are requirements** | Empty, loading, partial, error, no-permission, too much data, too little. Half of them change the layout. |
| **Evidence, not assertion** | No screenshot means untested, not passed. |

Every instruction the agent carries states why it exists, not just what to do. A model that knows the
reason adapts the step when the situation is unusual. A model handed a bare directive performs the
ceremony and misses the point, which is its own kind of default.

---

## What counts as truth

Most bad output comes from an agent believing the wrong source. Documentation describes intent, code
describes behavior, and the two drift apart in every real project. So the sources are ranked, and a
lower rank never overrides a higher one.

1. **Implementation truth.** The repository's actual code and its tested runtime behavior.
2. **Identity.** The existing design system, brand rules and product requirements.
3. **Evidence.** Research, usage, stakeholder input, screenshots, test results.
4. **Reference guidance.** Curated knowledge, then external official standards.
5. **Visual Spec.** Documentation and reference only, never an input to code generation.

The practical consequence is that a beautiful spec does not win against the code, and the agent is
required to say which rank an answer came from.

---

## What it does

- **33 skills** with an explicit router, so the agent picks the right one instead of improvising.
  21 of them declare what they are *not* for, naming the correct neighbour.
- **23 Knowledge Packs**, 130 rules, loaded selectively rather than pasted wholesale.
- **A local Design Studio** for putting visual alternatives in front of a human and recording the choice.
- **An isolated sandbox** that renders the real component in the project's own stack.
- **A multi-viewport audit** in light and dark, with optional axe-core.
- **Visual Spec** treated as documentation only, never as an input to code generation.

---

## Worked examples

### A visual defect

> *"This filter button is misaligned on mobile and I cannot work out why."*

```
1  project-dna            read how this repo does frontend
2  frontend-inspection    locate the element and the rule actually producing it
3  diagnose.sh            computed CSS and DOM for that element, with a screenshot
4  root-cause-analysis    only if the defect has returned before
5  safe-patching          smallest change that fixes the cause, not the symptom
6  responsive-audit       confirm across viewports, light and dark
```

The gate here is step 3. A fix proposed from a screenshot alone is a guess, and guesses about layout
look plausible and do not hold.

### A new screen

> *"We need a billing history page."*

```
1  product-discovery      who uses this, to finish what
2  inspect.sh             stack, tokens, styling pipeline
3  information-architecture   what goes where, what it is called
4  scenario-engine        fixtures with the ugly cases: 0 rows, 400 rows, a 90-char vendor name
5  <name the residue>     what the system already decides vs the 2-4 open choices
6  component-design       extend existing primitives rather than inventing
7  sandbox-run.sh         render it, look at it, critique before showing
8  audit.sh --axe         viewports, light and dark, accessibility rules
```

Step 5 is the one most tools skip. Without it you either repaint a product that already had an
identity, or you accept a template default on the one choice that was actually yours to make.

### "Make it premium"

> *"The dashboard looks cheap. Make it premium."*

```
1  design-critique        say concretely what reads as cheap, from the rendered evidence
2  design-system-discovery    find the identity that already exists in the code
3  art-direction          commit to a direction, bounded by that identity
4  visual-brainstorm      genuinely different options, not one idea in three costumes
5  studio.sh              put them in front of a human, record the choice
6  design-decisions       write down what was chosen and why
```

"Premium" is the request most likely to produce slop, because it invites surface treatment with no
structural change. Step 1 exists to convert a feeling into a list of defects, and step 3 to keep art
direction inside the product's own identity instead of repainting it.

---

## Install

Works in **Claude Code, Codex, Cursor, Kiro, GitHub Copilot and OpenCode.**

### Claude Code

One command, on v2.1.292 or later:

```sh
claude plugin install zanker --marketplace gfrancodev/zanker
```

Two commands on any version:

```sh
claude plugin marketplace add gfrancodev/zanker
claude plugin install zanker@zanker
```

Preview without installing: `claude --plugin-dir /path/to/zanker`

### The other five

Copy [`AGENTS.md`](AGENTS.md) to your project root. It carries the whole contract, the router and the
full skill catalog, and Codex, Cursor, Kiro, Copilot and OpenCode all read it natively.

For the deeper integration each one supports, the per-tool guide has the exact commands:

| Tool | Also reads | Guide |
| :- | :- | :- |
| Codex | nothing else needed | [`adapters/codex`](adapters/codex/README.md) |
| Cursor | `.cursor/rules/`, or its own plugin format | [`adapters/cursor`](adapters/cursor/README.md) |
| Kiro | `.kiro/steering/` | [`adapters/kiro`](adapters/kiro/README.md) |
| GitHub Copilot | `.github/agents/*.agent.md` | [`adapters/copilot`](adapters/copilot/README.md) |
| OpenCode | `.opencode/agents/`, `.claude/skills/` | [`adapters/opencode`](adapters/opencode/README.md) |

**The 33 skills need no conversion.** Every `SKILL.md` already uses the Agent Skills frontmatter
contract, `name` plus `description`, which Claude Code, Copilot and OpenCode read natively. They only
have to be visible at a path the tool scans, and each guide names it.

---

## Requirements

The agent, the skills and the Knowledge Packs are plain Markdown and JSON. They need nothing installed.

The optional scripts need **Node.js >= 20**. Screenshots and DOM diagnosis additionally need
Playwright in your project, and `audit.sh --axe` needs `axe-core`:

```sh
npm install -D playwright axe-core && npx playwright install chromium
```

Without them, those commands say so rather than guessing.

---

## Honest limits

Full list in [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md). The ones that matter most:

- **No faithful standalone sandbox** for Angular, Next Server Components, Nuxt or SvelteKit. Use the
  project's own dev server. Zanker discloses the parity gap rather than hiding it.
- **axe-core covers part of WCAG, never all of it.** No automated claim of full conformance.
- **No screenshot means untested, not passed.** The agent is required to say which checks did not run.
- **No bundled model** and no media generation service.

---

## Going deeper

- [CONTRIBUTING.md](CONTRIBUTING.md) is where the construction lives: the repository layout, the
  prompt contract, what is generated and must not be hand edited, the commands that gate a change,
  and how to add a skill or a knowledge pack.
- [`AGENT.md`](AGENT.md) is the operating contract itself, including the canonical source precedence
  and the conventions every prompt in the repository follows.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) covers the layers and the two main flows.
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) is the Contributor Covenant 2.1.
- [SECURITY.md](SECURITY.md) explains how to report a vulnerability privately, and documents what the
  plugin actually does on your machine: where it writes, what it executes, and what is opt in.
- [CHANGELOG.md](CHANGELOG.md) tracks releases.

Open an issue before changing the agent's process, the skill contract or the router, since those
decide output quality across every task. For anything smaller, send the pull request.

---

## License

MIT. See [LICENSE](LICENSE).
