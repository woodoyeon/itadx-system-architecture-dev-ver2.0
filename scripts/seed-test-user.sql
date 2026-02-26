-- 테스트 계정만 추가 (test@test.com / 1234). 이미 있으면 무시.
INSERT INTO users (email, password_hash, name, role, mart_id) VALUES
  ('test@test.com', '$2a$10$ekBrPht.6krV4w8T/3HD5.CyyWlY79OBVE8vg8rk/r6CtRMHqFux.', '테스트계정', 'admin', NULL)
ON CONFLICT (email) DO NOTHING;
