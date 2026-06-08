-- =============================================================================
-- GannPro9 SaaS — Seed Data
-- Run AFTER 001_initial_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DEFAULT ADMIN ACCOUNT
-- Email:    admin@gannpro9.com
-- Password: GannPro9!Admin@2026#Vx7k
-- ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN
-- -----------------------------------------------------------------------------

INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'GannPro Admin',
  'admin@gannpro9.com',
  '$2b$12$fYPpuYD.AoRB3Zrc6Dl5xe6iOCema7utmSUPG0pDZjp3dakPqAw/.',
  'admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Admin does not need a subscription record (full access via role check)
