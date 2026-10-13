#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
if ! command -v node >/dev/null 2>&1; then
  printf 'Zanker visual tools require Node.js >=20; the agent/skills/JSON work without it.\n' >&2
  exit 127
fi
exec node "$SCRIPT_DIR/bridge.mjs" "audit" "$@"
