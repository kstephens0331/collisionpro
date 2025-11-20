-- Phase 3.4: SMS & Email Notifications
-- Run this in Supabase SQL Editor

-- Create Notification table for logging all notifications sent
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE CASCADE,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL, -- sms, email
  "channel" TEXT NOT NULL, -- status_update, payment, review, estimate_sent
  "recipient" TEXT NOT NULL, -- phone number or email
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, failed
  "externalId" TEXT, -- Twilio SID or Resend ID
  "sentAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_notification_customer" ON "Notification"("customerId");
CREATE INDEX IF NOT EXISTS "idx_notification_estimate" ON "Notification"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_notification_type" ON "Notification"("type");
CREATE INDEX IF NOT EXISTS "idx_notification_sent" ON "Notification"("sentAt");

-- Create NotificationPreferences table for customer opt-in/opt-out
CREATE TABLE IF NOT EXISTS "NotificationPreferences" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT UNIQUE NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
  "smsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
  "statusUpdates" BOOLEAN NOT NULL DEFAULT true,
  "paymentReminders" BOOLEAN NOT NULL DEFAULT true,
  "reviewRequests" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationPreferences" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "notification_access" ON "Notification"
  FOR ALL
  USING (true);

CREATE POLICY "notification_prefs_access" ON "NotificationPreferences"
  FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON "Notification" TO authenticated;
GRANT ALL ON "Notification" TO service_role;
GRANT ALL ON "NotificationPreferences" TO authenticated;
GRANT ALL ON "NotificationPreferences" TO service_role;
