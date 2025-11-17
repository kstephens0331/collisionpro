-- =====================================================
-- PHASE 2.9: PDF GENERATION & EMAIL DELIVERY
-- MINIMAL VERSION - Just table creation, no indexes
-- =====================================================

-- 1. ESTIMATE EMAIL LOG
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

-- 2. ESTIMATE HISTORY
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

-- 3. UPDATE SHOP SETTINGS
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "senderEmail" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "senderName" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "replyToEmail" TEXT;
ALTER TABLE "ShopSettings" ADD COLUMN IF NOT EXISTS "emailDomainVerified" BOOLEAN DEFAULT FALSE;

-- 4. UPDATE ESTIMATE TABLE
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "sentAt" TIMESTAMP;
