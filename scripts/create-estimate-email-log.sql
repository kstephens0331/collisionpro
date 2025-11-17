-- EstimateEmailLog Table
-- Track all emails sent for estimates

CREATE TABLE IF NOT EXISTS "EstimateEmailLog" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,

  -- Recipient Information
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,

  -- Email Details
  "subject" TEXT NOT NULL,
  "sentBy" TEXT NOT NULL REFERENCES "User"("id"),
  "sentAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Email Provider Info
  "emailProvider" TEXT DEFAULT 'resend', -- resend, sendgrid, etc.
  "emailId" TEXT, -- Provider's email ID for tracking

  -- Status
  "status" TEXT NOT NULL DEFAULT 'sent', -- sent, failed, bounced, opened, clicked
  "errorMessage" TEXT, -- If failed

  -- Additional tracking
  "openedAt" TIMESTAMP,
  "clickedAt" TIMESTAMP,

  -- Metadata (JSON)
  "metadata" JSONB DEFAULT '{}',

  -- Timestamps
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_email_log_estimate" ON "EstimateEmailLog"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_email_log_recipient" ON "EstimateEmailLog"("recipientEmail");
CREATE INDEX IF NOT EXISTS "idx_email_log_sent_at" ON "EstimateEmailLog"("sentAt");
CREATE INDEX IF NOT EXISTS "idx_email_log_status" ON "EstimateEmailLog"("status");

-- Add comment
COMMENT ON TABLE "EstimateEmailLog" IS 'Tracks all emails sent for estimates including delivery status and engagement metrics';
