#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error 'Zanker visual tools require Node.js >=20; the agent/skills/JSON work without it.'
  exit 127
}
$bridge = Join-Path (Split-Path -Parent $PSScriptRoot) 'bridge.mjs'
& node $bridge 'build-adapters' @args
exit $LASTEXITCODE
