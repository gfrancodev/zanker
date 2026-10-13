# Zanker v1.0.0  Test report (2026-10-12)

## Verified on Linux build environment

- **22/22** native-plugin Node tests passed (manifest structure, skills and 23 Knowledge Packs with 130 rules, Studio HTTP/session access/feedback, HTML sandbox execution guard, frontend project inspection, icon/motion/media helpers, documentation-only Visual Spec contract, script feedback bridge, and native plugin portability).
- `node scripts/bridge.mjs validate`: **33 skills, 23 packs, 130 rules, no catalog/schema errors**.
- One-shot **Go compatibility installer** (not shipped inside native plugin): `go test -race -coverprofile`: **100.0% statement coverage** of Go installer package. This does **not** represent 100% JavaScript or UX test coverage.
- Optional compatibility installer smoke test on Linux AMD64: first install 227 files, second install unchanged; project received **no `.go` files, `zanker-setup` binaries, or global CLI**. Studio/HTML sandbox and local scripts worked in that smoke test.
- Go binaries built successfully for Linux, macOS, Windows on AMD64 and ARM64. **macOS, Windows and ARM64 binaries were cross-compiled, not executed natively**.
- Studio starts and returns a loopback URL and session token. Headless Chromium screenshot attempted but timed out in build environment; **no completed browser screenshot validation claimed**.

## Not verified or implemented

- Native `claude plugin validate` or installed Cursor local-plugin activation: those host executables are unavailable in this environment. Manifests follow current official docs and their structure was validated by tests; actual host activation remains for the recipient to verify.
- Angular/Next SSR/RSC/Nuxt/Vue/Svelte isolated sandbox adapters; current isolated adapter is HTML and React/Vite (the latter not E2E tested with a populated target node_modules in this build).
- Full Playwright/Axe E2E accessibility, screenshot regression, production environment parity or visual quality by a human reviewer.
- AI image/video generation without external providers, or automatic harness reinvocation after Studio feedback.
- OS-level sandbox/container security: project-local isolated files are *not* a security boundary.

## Security and Visual Spec

- Optional runtime tools require Node.js >=20 (not globally installed as a Zanker CLI).
- Vite spawned process receives a minimal allowlisted environment, not the full shell environment, but user-permission filesystem access still exists.
- Visual Spec 1.0 is used solely for visual documentation and reference, never as an implementation/code-generation source.
