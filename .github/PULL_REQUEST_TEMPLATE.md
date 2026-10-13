## What changed and why

<!-- What a reader of git log in a year needs. The diff already shows what; say why it was worth changing. -->

## Gates

```sh
npm test
bash scripts/validate.sh
bash scripts/build-adapters.sh --check
```

- [ ] The three commands above pass
- [ ] `AGENTS.md` and `adapters/` were regenerated rather than hand edited, if their source changed
- [ ] No markdown structure reached a prompt: no tables, bullets, numbered lists or bold labels in
      `agents/`, `skills/`, `commands/`, `rules/`, `AGENT.md` or `AGENTS.md`
- [ ] No em-dash, en-dash or ellipsis character anywhere
- [ ] Commit subjects open with a gitmoji

## If you added a skill

- [ ] `SKILL.md` has every section, and every list section holds its element
- [ ] `manifest.json` exists, with the same version as the others
- [ ] Every `<pack>` is a real id in `knowledge/index.json` and matches the manifest
- [ ] A `<route>` registers it in the agent's router, inside the right `<class>`

## Evidence

<!-- What you ran, and what you deliberately did not run. If anything visual changed, attach the
     screenshot: the project's own rule is that no screenshot means untested, not passed. -->
