param([Parameter(ValueFromRemainingArguments=$true)][string[]]$Rest)
$ErrorActionPreference = 'Stop'
$bridge = Join-Path $PSScriptRoot '..\bridge.mjs'
& node $bridge 'motion-css' @Rest
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
