# ItaDX MVP 개발환경 시작 (Windows PowerShell)
# 통신 흐름: admin-web -> gateway -> auth/admin/erp-api, engine-api

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot + "\.."
Set-Location $ProjectRoot

Write-Host "=== ItaDX MVP 개발환경 시작 ===" -ForegroundColor Cyan

# 1. Docker 인프라
Write-Host "`n1. PostgreSQL + Redis 시작..." -ForegroundColor Yellow
docker compose up -d postgres redis 2>$null
if ($LASTEXITCODE -ne 0) { docker-compose up -d postgres redis }
Start-Sleep -Seconds 5

# 2. DB 초기화
Write-Host "`n2. DB 초기화 및 시드..." -ForegroundColor Yellow
Get-Content "scripts\init-db.sql" -Encoding UTF8 -Raw | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp 2>$null
    Get-Content "scripts\seed.sql" -Encoding UTF8 -Raw | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp 2>$null
Write-Host "   DB 초기화 완료." -ForegroundColor Green

# 3. 의존성
Write-Host "`n3. pnpm 의존성 설치..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) { throw "pnpm install 실패" }

# 4. 엔진( Python ) 백그라운드 실행
Write-Host "`n4. Engine API (Python) 백그라운드 실행..." -ForegroundColor Yellow
$enginePath = Join-Path $ProjectRoot "engine\engine-api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$enginePath'; pip install -r requirements.txt; uvicorn main:app --reload --port 8000" -WindowStyle Normal

# 5. 프론트/게이트웨이/API (Turbo)
Write-Host "`n5. 프론트엔드 + API 서비스 시작 (Turbo)..." -ForegroundColor Yellow
Write-Host "   프론트: http://localhost:3000" -ForegroundColor Green
Write-Host "   게이트웨이: http://localhost:4003/api" -ForegroundColor Green
Write-Host "   로그인: bank@itadx.com / password123" -ForegroundColor Green
pnpm dev
