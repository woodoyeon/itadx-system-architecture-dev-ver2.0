-- ItaDX MVP 초기 스키마
-- 실행: psql -U itadx -d itadx_mvp -f 001-init.sql

-- UUID 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 마트
CREATE TABLE IF NOT EXISTS marts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  business_number VARCHAR(20) UNIQUE NOT NULL,
  representative VARCHAR(100),
  address TEXT,
  phone VARCHAR(20),
  contract_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  stability JSONB,
  screening_result VARCHAR(20),
  screening_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 점포
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) NOT NULL,
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  risk_index DECIMAL(5,2),
  risk_change DECIMAL(5,2),
  trends JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 거래처
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) NOT NULL,
  name VARCHAR(200) NOT NULL,
  business_number VARCHAR(20) UNIQUE NOT NULL,
  category VARCHAR(100),
  phone VARCHAR(20),
  score INTEGER,
  grade VARCHAR(1),
  risk_factors JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 입고
CREATE TABLE IF NOT EXISTS receivings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  mart_id UUID REFERENCES marts(id) NOT NULL,
  branch_id UUID REFERENCES branches(id),
  receiving_date DATE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  items JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 정산
CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  mart_id UUID REFERENCES marts(id) NOT NULL,
  period VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 신용점수
CREATE TABLE IF NOT EXISTS credit_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID REFERENCES merchants(id) NOT NULL,
  score INTEGER NOT NULL,
  grade VARCHAR(1) NOT NULL,
  factors JSONB,
  evaluated_at TIMESTAMPTZ NOT NULL,
  triggered_by VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리스크 평가
CREATE TABLE IF NOT EXISTS risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mart_id UUID REFERENCES marts(id) NOT NULL,
  track_a_level INTEGER NOT NULL,
  track_b_level INTEGER NOT NULL,
  final_level INTEGER NOT NULL,
  details JSONB,
  assessed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('bank', 'mart', 'admin')),
  mart_id UUID REFERENCES marts(id),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 감사 로그
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 알림
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리프레시 토큰
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ INDEXES (28개) ═══
CREATE INDEX idx_branches_mart ON branches(mart_id);
CREATE INDEX idx_merchants_mart ON merchants(mart_id);
CREATE INDEX idx_merchants_biz ON merchants(business_number);
CREATE INDEX idx_receivings_merchant ON receivings(merchant_id);
CREATE INDEX idx_receivings_mart ON receivings(mart_id);
CREATE INDEX idx_receivings_status ON receivings(status);
CREATE INDEX idx_receivings_date ON receivings(receiving_date);
CREATE INDEX idx_receivings_mart_status ON receivings(mart_id, status);
CREATE INDEX idx_settlements_merchant ON settlements(merchant_id);
CREATE INDEX idx_settlements_mart ON settlements(mart_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_credit_merchant ON credit_scores(merchant_id);
CREATE INDEX idx_credit_evaluated ON credit_scores(evaluated_at);
CREATE INDEX idx_risk_mart ON risk_assessments(mart_id);
CREATE INDEX idx_risk_level ON risk_assessments(final_level);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_refresh_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_expires ON refresh_tokens(expires_at);

-- ═══ SEED DATA ═══
-- 관리자 계정 (비밀번호: admin123!)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@itadx.com', '$2b$12$LJ3m4ys3Gzl1YIqCFBNKDOGJHbFLzHW8yLJCmq1HQE3Xr6tZTuXe2', '시스템관리자', 'admin')
ON CONFLICT (email) DO NOTHING;
