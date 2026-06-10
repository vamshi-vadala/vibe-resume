# Run Playwright e2e locally the reliable way (see .claude/skills/local-e2e).
# Usage: ./scripts/e2e-local.ps1 [spec-or-playwright-args...]
# Kills stale :3000, stashes .env.local, rebuilds, starts prod server,
# runs tests at --workers=1, then restores env. Leaves the server running.
param([Parameter(ValueFromRemainingArguments = $true)][string[]]$TestArgs)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

$stashed = $false
if (Test-Path .env.local) {
  Move-Item .env.local .env.local.bak -Force
  $stashed = $true
}

try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "build failed" }

  # npm is a .cmd shim on Windows — Start-Process needs cmd.exe to run it.
  $server = Start-Process cmd -ArgumentList "/c", "npm start" -PassThru -NoNewWindow
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    try { Invoke-WebRequest http://localhost:3000 -UseBasicParsing -TimeoutSec 2 | Out-Null; $ready = $true; break } catch {}
  }
  if (-not $ready) { throw "server did not become ready on :3000" }

  npx playwright test --workers=1 @TestArgs
  $exit = $LASTEXITCODE
}
finally {
  if ($stashed) { Move-Item .env.local.bak .env.local -Force }
  Write-Host "`nNOTE: prod server (no env) left running on :3000 — kill it and 'npm run build' before deploy-related work." -ForegroundColor Yellow
}
exit $exit
