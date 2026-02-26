# ItaDX MVP — 개발 모드 실행 (Docker는 Postgres/Redis만, 나머지 로컬)
# 사전에 1회: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

# Docker 컨테이너 확인 (없으면 안내)
$pg = docker ps --filter "name=itadx-postgres" --format "{{.Names}}" 2>$null
if (-not $pg) {
    Write-Host "Postgres/Redis가 안 떠 있습니다. 먼저: .\scripts\setup.ps1" -ForegroundColor Yellow
    $run = Read-Host "지금 Docker만 띄울까요? (y/n)"
    if ($run -eq "y") {
        docker compose -f (Join-Path $ProjectRoot "docker-compose.dev.yaml") up -d 2>$null
        if ($LASTEXITCODE -ne 0) { docker-compose -f (Join-Path $ProjectRoot "docker-compose.dev.yaml") up -d }
        Start-Sleep -Seconds 3
    } else { exit 1 }
}

Write-Host "`n=== ItaDX MVP 개발 서버 (통신 흐름) ===" -ForegroundColor Cyan
Write-Host "  Docker: Postgres(:5432) + Redis(:6379) 만 사용" -ForegroundColor Gray
Write-Host "  프론트: http://localhost:3000" -ForegroundColor Green
Write-Host "  로그인: bank@itadx.com / password123" -ForegroundColor Green
Write-Host "  종료: Ctrl+C`n" -ForegroundColor Gray

# Python 엔진을 별도 창에서 실행 (PATH 이슈 회피)
$enginePath = Join-Path $ProjectRoot "engine\engine-api"
$py = Get-Command python -ErrorAction SilentlyContinue; if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if ($py) {
    Write-Host "Engine API (Python) 별도 창에서 시작..." -ForegroundColor Gray
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$enginePath'; python -m uvicorn main:app --reload --port 8000"
}
# Turbo: 프론트 + Gateway + Auth/Admin/ERP API
pnpm dev
