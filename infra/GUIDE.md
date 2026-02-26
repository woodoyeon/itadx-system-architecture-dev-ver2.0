# infra/ — 인프라 설정 상세 가이드

## 이 폴더의 역할

Docker(컨테이너)와 Nginx(리버스 프록시) 설정을 담당합니다.
개발 환경에서 **한 명령어로 전체 서비스를 시작**할 수 있게 합니다.

---

## 파일별 역할 상세

### `docker/docker-compose.yaml` ★ 전체 서비스 정의

**역할:** 모든 서비스를 Docker 컨테이너로 정의

**코드가 하는 일:**
```yaml
services:
  postgres:      # PostgreSQL 데이터베이스
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: itadx_mvp
      POSTGRES_USER: itadx
      POSTGRES_PASSWORD: itadx1234

  redis:         # Redis (JWT 블랙리스트 + Bull Queue + Rate Limit)
    image: redis:7-alpine
    ports: ["6379:6379"]

  admin-web:     # 프론트엔드
    build: ../../apps/admin-web
    ports: ["3000:3000"]

  auth-api:      # 인증 서비스
    build: ../../services/auth-api
    ports: ["4001:4001"]

  admin-api:     # 관리 서비스
    build: ../../services/admin-api
    ports: ["4000:4000"]

  erp-api:       # ★ 입고확인/정산
    build: ../../services/erp-api
    ports: ["4002:4002"]

  gateway-api:   # API 게이트웨이
    build: ../../services/gateway-api
    ports: ["4003:4003"]

  engine-api:    # Python AI 엔진
    build: ../../engine/engine-api
    ports: ["8000:8000"]

  nginx:         # 리버스 프록시
    image: nginx:alpine
    ports: ["80:80"]
```

**사용법:**
```bash
docker-compose up -d              # 전체 시작
docker-compose up -d postgres redis  # DB/Redis만 시작
docker-compose logs -f erp-api    # erp-api 로그 실시간 보기
docker-compose down               # 전체 중지
docker-compose restart erp-api    # erp-api만 재시작
```

---

### `nginx/nginx.conf` ★ Nginx 리버스 프록시

**역할:** 브라우저의 모든 요청을 받아서 적절한 서비스로 전달

**코드가 하는 일:**
```nginx
# API 요청 → gateway-api로 전달
location /api/ {
    proxy_pass http://gateway-api:4003;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

# WebSocket 요청 → erp-api로 전달 (업그레이드 필요)
location /socket.io/ {
    proxy_pass http://erp-api:4002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;    # ★ WebSocket 업그레이드
    proxy_set_header Connection "upgrade";      # ★ HTTP → WebSocket 전환
}

# 나머지 → 프론트엔드로 전달
location / {
    proxy_pass http://admin-web:3000;
}
```

**WHY Nginx인가:**
- 하나의 도메인(:80)으로 모든 서비스 접근 가능
- CORS 문제 없음 (프론트와 API가 같은 도메인)
- WebSocket 업그레이드 처리
- 정적 파일 캐싱 (추후)
- SSL 종료 (추후 HTTPS)

---

## 루트 설정 파일 (프로젝트 최상위)

### `docker-compose.yaml` (루트)

**infra/docker/docker-compose.yaml의 축약 버전**으로, 개발 시 편의를 위해 루트에도 배치.
`docker-compose up -d` 명령을 프로젝트 루트에서 바로 실행 가능.

### `nginx/nginx.conf` (루트)

infra/nginx/nginx.conf와 동일. Docker에서 마운트하기 편하도록 루트에도 배치.
