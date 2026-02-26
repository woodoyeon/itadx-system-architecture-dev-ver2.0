# ItaDX MVP — 개발 모드 1회 셋업 (pnpm 설치 + Docker 최소 + DB + 의존성)
# 사용: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

Write-Host "`n=== ItaDX MVP 개발 모드 셋업 ===" -ForegroundColor Cyan

# 1. Node.js
Write-Host "`n[1/7] Node.js 확인..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "   Node.js가 없습니다. https://nodejs.org 에서 LTS 설치 후 다시 실행하세요." -ForegroundColor Red
    exit 1
}
Write-Host "   Node $(node -v)" -ForegroundColor Green

# 2. pnpm
Write-Host "`n[2/7] pnpm 확인/설치..." -ForegroundColor Yellow
$pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
if (-not $pnpm) {
    try {
        corepack enable 2>$null
        corepack prepare pnpm@latest --activate 2>$null
        $pnpm = Get-Command pnpm -ErrorAction SilentlyContinue
    } catch {}
    if (-not $pnpm) {
        Write-Host "   npm으로 pnpm 전역 설치 시도..." -ForegroundColor Gray
        npm install -g pnpm
    }
}
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "   pnpm을 사용할 수 없습니다. 'npm install -g pnpm' 후 다시 실행하세요." -ForegroundColor Red
    exit 1
}
Write-Host "   pnpm $(pnpm -v)" -ForegroundColor Green

# 3. Docker (Postgres + Redis만)
Write-Host "`n[3/7] Docker — Postgres + Redis만 기동 (개발용 최소)..." -ForegroundColor Yellow
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "   Docker가 없습니다. Docker Desktop 설치 후 다시 실행하세요." -ForegroundColor Red
    exit 1
}
try {
    docker compose -f (Join-Path $ProjectRoot "docker-compose.dev.yaml") up -d 2>$null
    if ($LASTEXITCODE -ne 0) { docker-compose -f (Join-Path $ProjectRoot "docker-compose.dev.yaml") up -d }
} catch {
    Write-Host "   docker compose 실패. Docker Desktop이 실행 중인지 확인하세요." -ForegroundColor Red
    exit 1
}
Write-Host "   대기 중... (5초)" -ForegroundColor Gray
Start-Sleep -Seconds 5

# 4. DB 초기화 및 시드
Write-Host "`n[4/7] DB 초기화 및 시드..." -ForegroundColor Yellow
$initOk = $false
try {
    $initSql = Get-Content (Join-Path $ProjectRoot "scripts\init-db.sql") -Encoding UTF8 -Raw
    $initSql | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp 2>&1 | Out-Null
    $seedSql = Get-Content (Join-Path $ProjectRoot "scripts\seed.sql") -Encoding UTF8 -Raw
    $seedSql | docker exec -i itadx-postgres psql -U itadx -d itadx_mvp 2>&1 | Out-Null
    $initOk = $true
} catch {
    Write-Host "   시드 재실행 시 중복 오류가 나면 무시해도 됩니다." -ForegroundColor Gray
}
if ($initOk) { Write-Host "   DB 초기화 완료." -ForegroundColor Green }

# 5. pnpm 의존성
Write-Host "`n[5/7] pnpm install (모노레포)..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) { throw "pnpm install 실패" }
Write-Host "   완료." -ForegroundColor Green

# 5.5. 공통 라이브러리 빌드 (database 등 — 런타임 로딩용)
Write-Host "`n[5.5/7] @itadx/database 빌드..." -ForegroundColor Yellow
pnpm run build:libs 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "   build:libs 실패 시 수동: pnpm run build:libs" -ForegroundColor Gray } else { Write-Host "   완료." -ForegroundColor Green }

# 6. Python 엔진 의존성 (선택)
Write-Host "`n[6/7] Python 엔진 의존성 (선택)..." -ForegroundColor Yellow
$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) { $py = Get-Command py -ErrorAction SilentlyContinue }
if ($py) {
    Set-Location (Join-Path $ProjectRoot "engine\engine-api")
    & $py.Name -m pip install -r requirements.txt -q 2>$null
    Set-Location $ProjectRoot
    Write-Host "   엔진 의존성 설치 완료." -ForegroundColor Green
} else {
    Write-Host "   Python 미설치 — 엔진은 나중에 'pip install -r engine/engine-api/requirements.txt' 후 실행 가능." -ForegroundColor Gray
}

Write-Host "`n=== 셋업 완료 ===" -ForegroundColor Cyan
Write-Host "개발 서버 실행: .\scripts\dev.ps1" -ForegroundColor Green
Write-Host "또는: pnpm dev:all" -ForegroundColor Green
Write-Host ""
