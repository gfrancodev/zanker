#!/bin/sh
# Regenerate the gitmoji allowlist inside commit-msg from the official source.
# Run it when gitmoji.dev adds an entry the hook rejects.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
curl -fsSL https://gitmoji.dev/api/gitmojis -o "$tmp"
SRC="$tmp" node -e '
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync(process.env.SRC, "utf8"));
const all = raw.gitmojis || raw;
const list = all.map(x => x.emoji).join(" ");
let s = fs.readFileSync("commit-msg", "utf8");
const before = s;
s = s.replace(/^for g in .*; do$/m, "for g in " + list + "; do");
s = s.replace(/official set, \d+ entries/, "official set, " + all.length + " entries");
if (s === before) { console.log("already current: " + all.length + " entries"); process.exit(0); }
fs.writeFileSync("commit-msg", s);
console.log("allowlist refreshed: " + all.length + " entries");
'
