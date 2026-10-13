# Security Policy

## Supported versions

Zanker is at 1.0.0 and has a single supported line: the latest release. Fixes land on `main` and ship
in the next tag.

| Version | Supported |
| :- | :- |
| 1.0.x | yes |
| < 1.0 | no, pre-release |

## Reporting a vulnerability

Do not open a public issue.

Use GitHub's private vulnerability reporting on
[the Security tab](https://github.com/gfrancodev/zanker/security/advisories/new), which keeps the
report private until a fix exists. If that is unavailable to you, email guatavojorgee2511@gmail.com
with `zanker security` in the subject.

Please include the plugin version, the harness you were on, what the plugin did, and what you
expected it to do instead. A proof of concept helps, even a rough one.

This is a single maintainer project, so do not expect an enterprise response time. Expect an
acknowledgement within a week. If you have heard nothing in two weeks, assume the message was lost
and send it again. Disclose publicly once a fix is released, or after 90 days, whichever comes first.

## What this plugin actually does

Worth knowing before you assess the surface.

### It runs on your machine, with your permissions

The optional scripts under `scripts/` are plain Node.js, run by your harness as you. There is no
daemon, no telemetry, no network call that this project initiates on its own, and no `bin/` directory
or compiled installer. A test enforces the last point, because several hosts refuse a plugin that
ships an executable.

### It writes in two places only

The project's `.zanker/` workspace, reached through an explicit `--project /absolute/path`, and the
plugin data directory. The plugin root itself is treated as read only. Path arguments go through a
containment check that rejects anything resolving outside the project root, symlinks are skipped
during traversal, and the walk is bounded in depth and entry count.

### Executing your code is opt in

`sandbox-run.sh` renders components without evaluating project JavaScript. Running the real thing
needs `--allow-execution`, which the agent is instructed to ask about first. If something executes
project code without that flag, that is a bug worth reporting.

### The preview server is loopback only

`studio.sh` binds to 127.0.0.1, localhost or ::1 and refuses any other address. Each session gets a
160 bit random token. Design mockups are treated as untrusted: their text is HTML escaped and their
markup renders inside an iframe with an empty `sandbox` attribute, so a mockup cannot reach the page
that hosts it.

### Fetching a remote URL is opt in

`audit.sh` and `diagnose.sh` accept http and https only, and refuse any host other than loopback
unless you pass `--allow-remote`. Point them at a production URL and you are sending a real request
from your machine, with whatever that implies for logs and rate limits on the other end.

### The knowledge packs are data, not code

The 23 packs under `knowledge/` are JSON that the agent reads as reference. They are never evaluated.

## Out of scope

A few things look like vulnerabilities and are not, so they will be closed rather than fixed.

Prompt injection through content the agent reads is a real risk and an open research problem, not a
bug with a patch. Zanker reads your repository, screenshots, and any URL you point it at, and
anything in there can try to influence it. Treat the agent's output as a proposal to review, not as
trusted. The same applies to a design mockup you feed into Studio.

An agent taking an action you did not expect, within the permissions your harness granted it, is a
scope or prompt problem. Report it as an ordinary bug.

Vulnerabilities in Playwright, axe-core, Node.js or your harness belong to those projects. Report
them upstream. If Zanker uses one of them in an unsafe way, that part is ours.
