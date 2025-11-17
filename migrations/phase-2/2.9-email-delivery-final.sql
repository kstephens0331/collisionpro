-- =====================================================
-- PHASE 2.9: PDF GENERATION & EMAIL DELIVERY
-- FINAL VERSION - Handles existing tables gracefully
-- =====================================================

-- Drop existing tables if they have issues, then recreate
DROP TABLE IF EXISTS "EstimateEmailLog" CASCADE;
DROP TABLE IF EXISTS "EstimateHistory" CASCADE;

-- 1. ESTIMATE EMAIL LOG
CREATE TABLE "EstimateEmailLog" (
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

CREATE INDEX "idx_email_log_estimate" ON "EstimateEmailLog"("estimateId");
CREATE INDEX "idx_email_log_recipient" ON "EstimateEmailLog"("recipientEmail");
CREATE INDEX "idx_email_log_sent_at" ON "EstimateEmailLog"("sentAt");
CREATE INDEX "idx_email_log_status" ON "EstimateEmailLog"("status");

-- 2. ESTIMATE HISTORY
CREATE TABLE "EstimateHistory" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_history_estimate" ON "EstimateHistory"("estimateId");
CREATE INDEX "idx_history_action" ON "EstimateHistory"("action");
CREATE INDEX "idx_history_created_at" ON "EstimateHistory"("createdAt");

-- 3. UPDATE SHOP SETTINGS (use DO block to handle errors)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ShopSettings' AND column_name = 'senderEmail'
    ) THEN
        ALTER TABLE "ShopSettings" ADD COLUMN "senderEmail" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ShopSettings' AND column_name = 'senderName'
    ) THEN
        ALTER TABLE "ShopSettings" ADD COLUMN "senderName" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ShopSettings' AND column_name = 'replyToEmail'
    ) THEN
        ALTER TABLE "ShopSettings" ADD COLUMN "replyToEmail" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ShopSettings' AND column_name = 'emailDomainVerified'
    ) THEN
        ALTER TABLE "ShopSettings" ADD COLUMN "emailDomainVerified" BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 4. UPDATE ESTIMATE TABLE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Estimate' AND column_name = 'sentAt'
    ) THEN
        ALTER TABLE "Estimate" ADD COLUMN "sentAt" TIMESTAMP;
    END IF;
END $$;

-- Success message
SELECT
  '✅ Phase 2.9 Migration Complete!' as status,
  'Tables: EstimateEmailLog, EstimateHistory' as created,
  'Columns: ShopSettings (4 email fields), Estimate (sentAt)' as added;
