# ItaDX MVP — 개발 모드 1회 셋업 (다른 PC에서 클론 후 이 스크립트 한 번만 실행)
# 사용: .\scripts\setup.ps1
# 적용: Node/pnpm 확인, Docker(Postgres+Redis) 기동, DB 스키마·시드(UTF8), env 파일, pnpm install, build:libs, Python(선택)

$ErrorActionPreference = "Stop"
$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $ProjectRoot

Write-Host "`n=== ItaDX MVP 개발 모드 한 번에 셋업 ===" -ForegroundColor Cyan

# 1. Node.js
Write-Host "`n[1/8] Node.js 확인..." -ForegroundColor Yellow
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "   Node.js가 없습니다. https://nodejs.org 에서 LTS 설치 후 다시 실행하세요." -ForegroundColor Red
    exit 1
}
Write-Host "   Node $(node -v)" -ForegroundColor Green

# 2. pnpm
Write-Host "`n[2/8] pnpm 확인/설치..." -ForegroundColor Yellow
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
Write-Host "`n[3/8] Docker — Postgres + Redis만 기동 (개발용 최소)..." -ForegroundColor Yellow
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "   Docker가 없습니다. Docker Desktop 설치 후 다시 실행하세요." -ForegroundColor Red
    exit 1
}
$prevErr = $ErrorActionPreference
$ErrorActionPreference = "Continue"
try {
    docker compose -f (Join-Path $ProjectRoot "docker-compose.dev.yaml") up -d 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { docker-compose -f (Join-Path $ProjectRoot "docker-compose.dev.yaml") up -d 2>&1 | Out-Null }
} finally { $ErrorActionPreference = $prevErr }
Write-Host "   대기 중... (5초)" -ForegroundColor Gray
Start-Sleep -Seconds 5

# 4. envs/.env.dev 생성 (없을 때만 — 개발용 포트 5433/6380)
Write-Host "`n[4/8] 환경변수 파일 (envs/.env.dev)..." -ForegroundColor Yellow
$envDevPath = Join-Path $ProjectRoot "envs\.env.dev"
$envExamplePath = Join-Path $ProjectRoot "envs\.env.example"
if (-not (Test-Path $envDevPath)) {
    $content = Get-Content $envExamplePath -Encoding UTF8 -Raw
    $content = $content -replace 'DB_PORT=5432', 'DB_PORT=5433'
    $content = $content -replace 'REDIS_PORT=6379', 'REDIS_PORT=6380'
    $content = $content -replace 'DB_PASS=CHANGE_ME', 'DB_PASS=itadx_dev'
    $content = $content -replace 'JWT_SECRET=CHANGE_ME_MIN_32_CHARS_LONG_SECRET_KEY_HERE', 'JWT_SECRET=itadx_dev_secret_key_min_32_chars_required_here'
    [System.IO.File]::WriteAllText($envDevPath, $content, [System.Text.UTF8Encoding]::new($false))
    Write-Host "   envs/.env.dev 생성 완료 (DB_PORT=5433, REDIS_PORT=6380)." -ForegroundColor Green
} else {
    Write-Host "   envs/.env.dev 이미 있음." -ForegroundColor Green
}

# 5. DB 초기화 및 시드 (UTF8)
Write-Host "`n[5/8] DB 스키마 및 시드 데이터 (UTF8)..." -ForegroundColor Yellow
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
if ($initOk) { Write-Host "   DB 초기화·시드 완료 (로그인: test@test.com / password123)." -ForegroundColor Green }

# 6. pnpm 의존성
Write-Host "`n[6/8] pnpm install (모노레포)..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) { throw "pnpm install 실패" }
Write-Host "   완료." -ForegroundColor Green

# 7. 공통 라이브러리 빌드 (database 등 — 런타임 로딩용)
Write-Host "`n[7/8] @itadx/database 등 라이브러리 빌드..." -ForegroundColor Yellow
pnpm run build:libs 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "   build:libs 실패 시 수동: pnpm run build:libs" -ForegroundColor Gray } else { Write-Host "   완료." -ForegroundColor Green }

# 8. Python 엔진 의존성 (선택)
Write-Host "`n[8/8] Python 엔진 의존성 (선택)..." -ForegroundColor Yellow
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
Write-Host "개발 서버 실행: .\scripts\dev.ps1 또는 pnpm dev" -ForegroundColor Green
Write-Host "로그인: http://localhost:3000 — test@test.com / password123" -ForegroundColor Green
Write-Host ""
