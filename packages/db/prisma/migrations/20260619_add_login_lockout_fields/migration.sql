-- Migration: add_login_lockout_fields
-- Security: Per-account brute-force lockout fields (OWASP Authentication CS)
-- Apply with: ALTER TABLE "User" ADD COLUMN ...

ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
