#!/usr/bin/env bash
# Refresh vendored UI UX Pro Max assets (design-system mode only).
set -euo pipefail
ROOT="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
VER="${UUPM_VERSION:-v2.15.0}"
BASE="https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/${VER}/src/ui-ux-pro-max"
DEST="$ROOT/vendor/ui-ux-pro-max"
mkdir -p "$DEST/scripts" "$DEST/data"
for f in search.py core.py design_system.py reasoning_contract.py; do
  curl -fsSL "$BASE/scripts/$f" -o "$DEST/scripts/$f"
done
for f in styles.csv colors.csv typography.csv products.csv landing.csv ux-guidelines.csv motion.csv ui-reasoning.csv catalog-summary.json; do
  curl -fsSL "$BASE/data/$f" -o "$DEST/data/$f"
done
curl -fsSL "https://raw.githubusercontent.com/nextlevelbuilder/ui-ux-pro-max-skill/${VER}/LICENSE" -o "$DEST/LICENSE"
echo "Updated $DEST at $VER"
