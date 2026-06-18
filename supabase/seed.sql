-- =============================================================================
-- GannPro9 SaaS — Seed Data
-- Run AFTER 001_initial_schema.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DEFAULT ADMIN ACCOUNT
-- Email:    admin@gannpro9.com
-- Password: GannPro9@admin2026
-- ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN
-- -----------------------------------------------------------------------------

INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'GannPro Admin',
  'admin@gannpro9.com',
  '$2b$12$wC790Wwzn1d.Eys538hRsuX0k.t6fZas4jL3QlNagT6C59LveFp06',
  'admin',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Admin does not need a subscription record (full access via role check)
