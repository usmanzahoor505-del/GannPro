-- =============================================================================
-- 003: Add payment_method column to payments
-- The app records how the user paid (jazzcash / easypaisa / bank / card).
-- The original 001 schema never included this column, causing inserts to fail
-- with: "Could not find the 'payment_method' column of 'payments'".
-- =============================================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Tell PostgREST (Supabase API) to reload its schema cache immediately.
NOTIFY pgrst, 'reload schema';
