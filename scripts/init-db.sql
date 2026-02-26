-- ItaDX MVP 데이터베이스 초기화 스크립트
-- 실행: docker exec -i itadx-postgres psql -U itadx -d itadx_mvp < scripts/init-db.sql

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════
-- 1. 마트 (부모 테이블)
-- ════════════════════════════════════
CREATE TABLE IF NOT EXISTS marts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  business_number VARCHAR(20) NOT NULL UNIQUE,
  representative VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  contract_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  stability JSONB,
  screening_result VARCHAR(20),
  screening_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 지점
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID NOT NULL REFERENCES marts(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  risk_index DECIMAL(5,2),
  risk_change DECIMAL(5,2),
  trends JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 가맹점
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID NOT NULL REFERENCES marts(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  business_number VARCHAR(20) NOT NULL UNIQUE,
  category VARCHAR(100),
  phone VARCHAR(20),
  score INTEGER,
  grade VARCHAR(1),
  risk_factors JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 사용자
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('bank', 'mart', 'admin')),
  mart_id UUID REFERENCES marts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ★ 입고 (핵심 테이블)
CREATE TABLE IF NOT EXISTS receivings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  mart_id UUID NOT NULL REFERENCES marts(id),
  branch_id UUID REFERENCES branches(id),
  receiving_date DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  items JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 정산
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  mart_id UUID NOT NULL REFERENCES marts(id),
  period VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. 신용점수
CREATE TABLE IF NOT EXISTS credit_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants(id),
  score INTEGER NOT NULL,
  grade VARCHAR(1) NOT NULL,
  factors JSONB,
  evaluated_at TIMESTAMPTZ NOT NULL,
  triggered_by VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. 리스크 평가
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID NOT NULL REFERENCES marts(id),
  track_a_level INTEGER NOT NULL,
  track_b_level INTEGER NOT NULL,
  final_level INTEGER NOT NULL,
  details JSONB,
  assessed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. 감사 로그
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  trace_id VARCHAR(100),
  ip VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. 알림
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. 리프레시 토큰
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ════════════════════════════════════
-- 인덱스 (28개)
-- ════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_branches_mart_id ON branches(mart_id);
CREATE INDEX IF NOT EXISTS idx_merchants_mart_id ON merchants(mart_id);
CREATE INDEX IF NOT EXISTS idx_merchants_business_number ON merchants(business_number);
CREATE INDEX IF NOT EXISTS idx_merchants_grade ON merchants(grade);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_mart_id ON users(mart_id);
CREATE INDEX IF NOT EXISTS idx_receivings_merchant_id ON receivings(merchant_id);
CREATE INDEX IF NOT EXISTS idx_receivings_mart_id ON receivings(mart_id);
CREATE INDEX IF NOT EXISTS idx_receivings_status ON receivings(status);
CREATE INDEX IF NOT EXISTS idx_receivings_date ON receivings(receiving_date);
CREATE INDEX IF NOT EXISTS idx_receivings_branch_id ON receivings(branch_id);
CREATE INDEX IF NOT EXISTS idx_receivings_confirmed_at ON receivings(confirmed_at);
CREATE INDEX IF NOT EXISTS idx_receivings_mart_status ON receivings(mart_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_merchant_id ON settlements(merchant_id);
CREATE INDEX IF NOT EXISTS idx_settlements_mart_id ON settlements(mart_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_credit_scores_merchant_id ON credit_scores(merchant_id);
CREATE INDEX IF NOT EXISTS idx_credit_scores_evaluated_at ON credit_scores(evaluated_at);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_mart_id ON risk_assessments(mart_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_assessed_at ON risk_assessments(assessed_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
