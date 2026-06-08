-- =============================================================================
-- GannPro9 SaaS — Initial Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL → New query)
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TYPE subscription_plan AS ENUM ('basic', 'standard', 'pro');

CREATE TYPE subscription_status AS ENUM (
  'trial',
  'active',
  'expired',
  'pending',
  'cancelled',
  'rejected'
);

CREATE TYPE payment_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'error');

-- =============================================================================
-- USERS
-- =============================================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'user',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_is_active ON users (is_active);

-- =============================================================================
-- OTP VERIFICATIONS (email verification before account creation)
-- =============================================================================

CREATE TABLE otp_verifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL,
  otp_code      VARCHAR(6) NOT NULL,
  expires_at      TIMESTAMPTZ NOT NULL,
  is_used       BOOLEAN NOT NULL DEFAULT FALSE,
  name          VARCHAR(255),
  password_hash VARCHAR(255),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_verifications (email);
CREATE INDEX idx_otp_email_active ON otp_verifications (email, is_used, expires_at);

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================

CREATE TABLE subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plan        subscription_plan,
  status      subscription_status NOT NULL DEFAULT 'trial',
  trial_start TIMESTAMPTZ,
  trial_end   TIMESTAMPTZ,
  sub_start   TIMESTAMPTZ,
  sub_end     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_trial_end ON subscriptions (trial_end);
CREATE INDEX idx_subscriptions_sub_end ON subscriptions (sub_end);

-- One active subscription record per user (latest managed by app logic)
CREATE UNIQUE INDEX idx_subscriptions_user_active
  ON subscriptions (user_id)
  WHERE status IN ('trial', 'active', 'pending');

-- =============================================================================
-- PAYMENTS
-- =============================================================================

CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  plan_selected   subscription_plan NOT NULL,
  amount_pkr      INTEGER NOT NULL,
  transaction_id  VARCHAR(255),
  screenshot_url  TEXT,
  status          payment_status NOT NULL DEFAULT 'pending',
  receipt_id      VARCHAR(50),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments (user_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_submitted_at ON payments (submitted_at DESC);
CREATE UNIQUE INDEX idx_payments_receipt_id ON payments (receipt_id)
  WHERE receipt_id IS NOT NULL;

-- =============================================================================
-- RECEIPTS (generated automatically on admin approval)
-- =============================================================================

CREATE TABLE receipts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no  VARCHAR(50) NOT NULL UNIQUE,
  payment_id  UUID NOT NULL REFERENCES payments (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_name   VARCHAR(255) NOT NULL,
  user_email  VARCHAR(255) NOT NULL,
  plan        subscription_plan NOT NULL,
  amount_pkr  INTEGER NOT NULL,
  valid_from  TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'APPROVED',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_receipts_user_id ON receipts (user_id);
CREATE INDEX idx_receipts_payment_id ON receipts (payment_id);

-- =============================================================================
-- NOTIFICATIONS
-- =============================================================================

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  type       notification_type NOT NULL DEFAULT 'info',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read)
  WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RECEIPT NUMBER GENERATOR
-- Format: GPN-YYYYMMDD-XXXXXX (6 random alphanumeric chars)
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_receipt_no()
RETURNS VARCHAR(50) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  suffix TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    suffix := suffix || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN 'GPN-' || to_char(NOW(), 'YYYYMMDD') || '-' || suffix;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY
-- Backend uses service_role key (bypasses RLS).
-- Frontend Realtime uses anon key with restrictive policies.
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Deny all direct anon/authenticated access — all writes go through Express API
CREATE POLICY "deny_anon_users" ON users FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_otp" ON otp_verifications FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_subscriptions" ON subscriptions FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_payments" ON payments FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_receipts" ON receipts FOR ALL TO anon USING (FALSE);
CREATE POLICY "deny_anon_notifications" ON notifications FOR ALL TO anon USING (FALSE);

-- =============================================================================
-- SUPABASE REALTIME
-- Enable live updates for notifications, subscriptions, and payments
-- =============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;

-- =============================================================================
-- STORAGE BUCKET — payment screenshots
-- Run separately if bucket creation via SQL fails; use Dashboard instead.
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  FALSE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: only service role uploads via backend API
CREATE POLICY "service_role_upload_screenshots"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'payment-screenshots');

CREATE POLICY "service_role_read_screenshots"
  ON storage.objects FOR SELECT TO service_role
  USING (bucket_id = 'payment-screenshots');

CREATE POLICY "service_role_delete_screenshots"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'payment-screenshots');

-- =============================================================================
-- HELPER VIEWS (for admin dashboard stats)
-- =============================================================================

CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') AS active_subscribers,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'trial') AS trial_users,
  (SELECT COUNT(*) FROM subscriptions WHERE status = 'expired') AS expired_users,
  (SELECT COUNT(*) FROM payments WHERE status = 'pending') AS pending_payments;
