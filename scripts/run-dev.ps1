# ItaDX MVP — 셋업 후 개발 서버까지 한 번에 (최초 실행용)
# 사용: .\scripts\run-dev.ps1

$ErrorActionPreference = "Stop"
$ScriptDir = $PSScriptRoot
& (Join-Path $ScriptDir "setup.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "`n이제 개발 서버를 띄웁니다...`n" -ForegroundColor Cyan
& (Join-Path $ScriptDir "dev.ps1")
