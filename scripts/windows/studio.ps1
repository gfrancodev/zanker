param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Rest)
$ErrorActionPreference = 'Stop'
$bridge = Join-Path $PSScriptRoot '..\bridge.mjs'
& node $bridge 'studio' @Rest
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
