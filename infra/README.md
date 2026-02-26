# 🐳 infra/ — Docker + Nginx + 모니터링

## 전체 인프라 구성도
```
[브라우저] → [Nginx :80] → [admin-web :3000]
                         → [gateway-api :4003] → [auth-api :4001]
                                               → [admin-api :4000]
                                               → [erp-api :4002]
                                               → [engine-api :8000]
                         → [PostgreSQL :5432]
                         → [Redis :6379]

[Prometheus :9090] → 15초마다 메트릭 수집 → [Grafana :3001] 시각화
```

## Docker — 실제 설정: `docker-compose.yaml`
```bash
docker-compose up -d          # 전체 서비스 시작
docker-compose logs -f erp-api # erp-api 로그 보기
docker-compose down           # 전체 중지
```

## Nginx — 실제 설정: `nginx/nginx.conf`
```nginx
location /api/ { proxy_pass http://gateway-api:4003; }   # API
location /socket.io/ { proxy_pass ...; proxy_set_header Upgrade $http_upgrade; }  # WebSocket
location / { proxy_pass http://admin-web:3000; }          # 프론트엔드
```

## 모니터링 — Prometheus + Grafana
```bash
cd infra/monitoring
docker-compose -f docker-compose.monitoring.yaml up -d
# → Grafana: http://localhost:3001 (admin/admin)
# → Prometheus: http://localhost:9090
```

## 오토스케일링 (V3.1 Kubernetes)
CPU 70% 초과 → 자동으로 서버 대수 증가 (2대 → 최대 10대)
