#!/bin/bash
echo "=== ItaDX MVP 개발환경 시작 ==="

# 1. Docker infra
echo "1. Starting PostgreSQL + Redis..."
docker-compose up -d postgres redis
sleep 3

# 2. DB init
echo "2. Initializing database..."
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/init-db.sql
docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/seed.sql

# 3. Install deps
echo "3. Installing dependencies..."
pnpm install

# 4. Start services (background)
echo "4. Starting services..."
pnpm --filter @itadx/auth-api dev &
pnpm --filter @itadx/admin-api dev &
pnpm --filter @itadx/erp-api dev &
pnpm --filter @itadx/gateway-api dev &

# 5. Engine
echo "5. Starting engine..."
cd engine/engine-api && pip install -r requirements.txt && uvicorn main:app --reload --port 8000 &
cd ../..

# 6. Frontend
echo "6. Starting frontend..."
pnpm --filter admin-web dev

echo "=== All services running ==="
echo "Frontend: http://localhost:3000"
echo "Gateway:  http://localhost:4003/api"
echo "Swagger:  http://localhost:4001/api/docs"
echo "Engine:   http://localhost:8000/api/docs"
