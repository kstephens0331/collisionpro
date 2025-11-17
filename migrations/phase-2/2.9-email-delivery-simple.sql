-- =====================================================
-- PHASE 2.9: PDF GENERATION & EMAIL DELIVERY
-- Email tracking and estimate history logging
-- SIMPLIFIED: No verification queries, just table creation
-- =====================================================

-- =====================================================
-- 1. ESTIMATE EMAIL LOG
-- Track all emails sent for estimates
-- =====================================================
CREATE TABLE IF NOT EXISTS "EstimateEmailLog" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "subject" TEXT NOT NULL,
  "sentBy" TEXT NOT NULL,
  "sentAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "emailProvider" TEXT DEFAULT 'resend',
  "emailId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'sent',
  "errorMessage" TEXT,
  "openedAt" TIMESTAMP,
  "clickedAt" TIMESTAMP,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for EstimateEmailLog
CREATE INDEX IF NOT EXISTS "idx_email_log_estimate" ON "EstimateEmailLog"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_email_log_recipient" ON "EstimateEmailLog"("recipientEmail");
CREATE INDEX IF NOT EXISTS "idx_email_log_sent_at" ON "EstimateEmailLog"("sentAt");
CREATE INDEX IF NOT EXISTS "idx_email_log_status" ON "EstimateEmailLog"("status");

-- =====================================================
-- 2. ESTIMATE HISTORY
-- Audit trail of all estimate changes
-- =====================================================
CREATE TABLE IF NOT EXISTS "EstimateHistory" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for EstimateHistory
CREATE INDEX IF NOT EXISTS "idx_history_estimate" ON "EstimateHistory"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_history_action" ON "EstimateHistory"("action");
CREATE INDEX IF NOT EXISTS "idx_history_created_at" ON "EstimateHistory"("createdAt");

-- =====================================================
-- 3. UPDATE SHOP SETTINGS FOR EMAIL
-- Add email configuration fields
-- =====================================================
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "senderEmail" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "senderName" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "replyToEmail" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "emailDomainVerified" BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 4. UPDATE ESTIMATE TABLE FOR EMAIL TRACKING
-- Add sentAt timestamp for estimates
-- =====================================================
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP;

-- =====================================================
-- DONE!
-- =====================================================
-- Tables Created: EstimateEmailLog, EstimateHistory
-- Columns Added: ShopSettings (4 email fields), Estimate (sentAt)
--
-- To verify, run these queries separately:
--   SELECT * FROM "EstimateEmailLog" LIMIT 1;
--   SELECT * FROM "EstimateHistory" LIMIT 1;
--   SELECT "senderEmail", "senderName", "replyToEmail", "emailDomainVerified" FROM "ShopSettings" LIMIT 1;
--   SELECT "id", "sentAt" FROM "Estimate" LIMIT 1;
-- =====================================================
