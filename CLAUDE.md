# CLAUDE.md — ItaDX MVP Project Context

## What is this project?
마트 입고/거래처 리스크 통합 관리 시스템 (금융기관용).
은행이 마트 거래처의 신용을 평가하고 리스크를 모니터링하는 B2B SaaS.

## Core Business Logic (★ 최우선)
입고확인(Receiving Confirm)이 시스템의 핵심 트리거:
1. 마트 사용자가 "입고확인" 클릭
2. 비관적 잠금 + 트랜잭션으로 상태 변경
3. Bull Queue → v10 신용점수 재산출
4. WebSocket → 은행 실시간 알림

## Architecture
Monorepo (pnpm workspaces + Turborepo)
- apps/admin-web (Next.js 14, :3000) — 통합 대시보드
- services/auth-api (Nest.js, :4001) — JWT 인증
- services/admin-api (Nest.js, :4000) — CRUD + 대시보드
- services/erp-api (Nest.js, :4002) — ★ 입고확인, 정산
- services/gateway-api (Nest.js, :4003) — 프록시, Rate Limit
- engine/engine-api (Python FastAPI, :8000) — v41/v10/듀얼트랙/점포리스크
- libs/* — @itadx/common, auth, audit, database, config, websocket

## Key Rules
- API 응답: { success, data, meta? } 형식
- 에러: BusinessException + ErrorCodes
- 인증: JWT 15분 + Refresh 7일 + Rotation
- RBAC: bank / mart / admin
- 감사로그: @Auditable 데코레이터
- Git: feat/fix/chore + Conventional Commits

## Commands
```bash
pnpm dev                           # 전체 개발서버
pnpm --filter @itadx/erp-api dev   # ERP만
cd engine/engine-api && uvicorn main:app --reload  # 엔진
docker-compose up -d               # 전체 Docker
```
