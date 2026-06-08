-- Add registration data to OTP table (account created only after OTP verified)
ALTER TABLE otp_verifications
  ADD COLUMN IF NOT EXISTS name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
