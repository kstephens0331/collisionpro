-- =============================================
-- Real-time Notifications System
-- =============================================
-- Push notifications, email, SMS, and in-app notifications
-- for estimate updates, parts arrivals, customer messages, etc.

-- Notification Types Enum
CREATE TYPE notification_type AS ENUM (
  'estimate_created',
  'estimate_updated',
  'estimate_approved',
  'estimate_rejected',
  'parts_ordered',
  'parts_arrived',
  'job_started',
  'job_completed',
  'payment_received',
  'message_received',
  'technician_assigned',
  'supplement_required',
  'insurance_approved',
  'custom'
);

-- Notification Channels
CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'email',
  'sms',
  'push',
  'webhook'
);

-- Notification Priority
CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- Main Notifications Table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Recipients
  "userId" TEXT, -- Can be null for broadcast notifications
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Notification details
  "type" notification_type NOT NULL,
  "channel" notification_channel NOT NULL,
  "priority" notification_priority DEFAULT 'normal',

  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionUrl" TEXT, -- Where to go when clicked
  "actionLabel" TEXT, -- Button text

  -- Rich content
  "metadata" JSONB DEFAULT '{}'::jsonb, -- Additional data (estimate ID, amounts, etc.)
  "imageUrl" TEXT,

  -- Related entities
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "customerId" TEXT,

  -- Delivery tracking
  "sentAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "readAt" TIMESTAMP,
  "clickedAt" TIMESTAMP,

  -- Status
  "status" TEXT DEFAULT 'pending', -- pending, sent, delivered, read, failed
  "errorMessage" TEXT,
  "retryCount" INTEGER DEFAULT 0,

  -- Expiry
  "expiresAt" TIMESTAMP,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Notification Preferences (per user/shop)
CREATE TABLE IF NOT EXISTS "NotificationPreference" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Channel preferences
  "enableInApp" BOOLEAN DEFAULT true,
  "enableEmail" BOOLEAN DEFAULT true,
  "enableSms" BOOLEAN DEFAULT false,
  "enablePush" BOOLEAN DEFAULT true,

  -- Type preferences (JSONB for flexibility)
  "typePreferences" JSONB DEFAULT '{}'::jsonb,
  -- Example: {"estimate_created": {"email": true, "sms": false}, ...}

  -- Quiet hours
  "quietHoursEnabled" BOOLEAN DEFAULT false,
  "quietHoursStart" TIME,
  "quietHoursEnd" TIME,
  "quietHoursTimezone" TEXT DEFAULT 'America/New_York',

  -- Digest settings
  "enableDigest" BOOLEAN DEFAULT false,
  "digestFrequency" TEXT DEFAULT 'daily', -- daily, weekly, never
  "digestTime" TIME DEFAULT '09:00',

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("userId", "shopId")
);

-- Notification Templates
CREATE TABLE IF NOT EXISTS "NotificationTemplate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  "type" notification_type NOT NULL,
  "channel" notification_channel NOT NULL,

  "name" TEXT NOT NULL,
  "subject" TEXT, -- For email
  "template" TEXT NOT NULL, -- Template with variables {{variable_name}}

  -- Variables available in template
  "variables" TEXT[], -- ["customer_name", "estimate_number", "total", etc.]

  "isDefault" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Notification Queue (for batch processing)
CREATE TABLE IF NOT EXISTS "NotificationQueue" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "notificationId" TEXT REFERENCES "Notification"("id") ON DELETE CASCADE,

  "scheduledFor" TIMESTAMP NOT NULL,
  "processedAt" TIMESTAMP,

  "status" TEXT DEFAULT 'queued', -- queued, processing, completed, failed
  "attempts" INTEGER DEFAULT 0,
  "lastError" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Notification Analytics
CREATE TABLE IF NOT EXISTS "NotificationAnalytics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,

  -- Counts by channel
  "inAppSent" INTEGER DEFAULT 0,
  "emailSent" INTEGER DEFAULT 0,
  "smsSent" INTEGER DEFAULT 0,
  "pushSent" INTEGER DEFAULT 0,

  -- Engagement metrics
  "totalDelivered" INTEGER DEFAULT 0,
  "totalRead" INTEGER DEFAULT 0,
  "totalClicked" INTEGER DEFAULT 0,
  "totalFailed" INTEGER DEFAULT 0,

  -- By type
  "typeBreakdown" JSONB DEFAULT '{}'::jsonb,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "date")
);

-- Real-time Events (for WebSocket/SSE)
CREATE TABLE IF NOT EXISTS "RealtimeEvent" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  "userId" TEXT,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  "eventType" TEXT NOT NULL, -- estimate_update, parts_status, etc.
  "payload" JSONB NOT NULL,

  "broadcasted" BOOLEAN DEFAULT false,
  "broadcastedAt" TIMESTAMP,

  "createdAt" TIMESTAMP DEFAULT NOW(),

  -- Auto-delete old events
  "expiresAt" TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS idx_notification_shop ON "Notification"("shopId");
CREATE INDEX IF NOT EXISTS idx_notification_type ON "Notification"("type");
CREATE INDEX IF NOT EXISTS idx_notification_channel ON "Notification"("channel");
CREATE INDEX IF NOT EXISTS idx_notification_status ON "Notification"("status");
CREATE INDEX IF NOT EXISTS idx_notification_created ON "Notification"("createdAt");
CREATE INDEX IF NOT EXISTS idx_notification_estimate ON "Notification"("estimateId");

CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON "NotificationQueue"("scheduledFor");
CREATE INDEX IF NOT EXISTS idx_queue_status ON "NotificationQueue"("status");

CREATE INDEX IF NOT EXISTS idx_realtime_user ON "RealtimeEvent"("userId");
CREATE INDEX IF NOT EXISTS idx_realtime_shop ON "RealtimeEvent"("shopId");
CREATE INDEX IF NOT EXISTS idx_realtime_type ON "RealtimeEvent"("eventType");
CREATE INDEX IF NOT EXISTS idx_realtime_created ON "RealtimeEvent"("createdAt");
CREATE INDEX IF NOT EXISTS idx_realtime_expires ON "RealtimeEvent"("expiresAt");

-- Seed default notification templates
INSERT INTO "NotificationTemplate" ("id", "type", "channel", "name", "subject", "template", "variables", "isDefault") VALUES
-- Email templates
(
  'tmpl-estimate-created-email',
  'estimate_created',
  'email',
  'New Estimate Created',
  'New Estimate #{{estimate_number}} - {{vehicle}}',
  'Hello {{customer_name}},

A new estimate has been created for your {{vehicle}}.

Estimate Number: {{estimate_number}}
Total: ${{total}}
Parts: ${{parts_total}}
Labor: ${{labor_total}}

View your estimate: {{estimate_url}}

Thank you,
{{shop_name}}',
  ARRAY['customer_name', 'vehicle', 'estimate_number', 'total', 'parts_total', 'labor_total', 'estimate_url', 'shop_name'],
  true
),

-- SMS templates
(
  'tmpl-estimate-created-sms',
  'estimate_created',
  'sms',
  'New Estimate Created (SMS)',
  NULL,
  'Your estimate for {{vehicle}} is ready! #{{estimate_number}} - ${{total}}. View: {{estimate_url}}',
  ARRAY['vehicle', 'estimate_number', 'total', 'estimate_url'],
  true
),

-- In-app templates
(
  'tmpl-estimate-created-app',
  'estimate_created',
  'in_app',
  'New Estimate Created (In-App)',
  NULL,
  'Estimate #{{estimate_number}} has been created for {{customer_name}}. Total: ${{total}}',
  ARRAY['estimate_number', 'customer_name', 'total'],
  true
),

-- Parts ordered
(
  'tmpl-parts-ordered-email',
  'parts_ordered',
  'email',
  'Parts Ordered',
  'Parts Ordered for Estimate #{{estimate_number}}',
  'Hello {{customer_name}},

We have ordered the parts for your {{vehicle}}.

Order Number: {{order_number}}
Estimated Delivery: {{delivery_date}}
Number of Parts: {{parts_count}}

We will notify you when the parts arrive.

Thank you,
{{shop_name}}',
  ARRAY['customer_name', 'vehicle', 'order_number', 'delivery_date', 'parts_count', 'shop_name'],
  true
),

-- Job started
(
  'tmpl-job-started-sms',
  'job_started',
  'sms',
  'Work Started (SMS)',
  NULL,
  'Good news! We have started repairs on your {{vehicle}}. Estimated completion: {{completion_date}}',
  ARRAY['vehicle', 'completion_date'],
  true
),

-- Job completed
(
  'tmpl-job-completed-email',
  'job_completed',
  'email',
  'Repairs Completed',
  'Your {{vehicle}} is Ready!',
  'Hello {{customer_name}},

Great news! We have completed repairs on your {{vehicle}}.

Your vehicle is ready for pickup.
Final Total: ${{final_total}}
Payment Status: {{payment_status}}

Please call us at {{shop_phone}} to schedule pickup.

Thank you,
{{shop_name}}',
  ARRAY['customer_name', 'vehicle', 'final_total', 'payment_status', 'shop_phone', 'shop_name'],
  true
);

-- Trigger to update analytics
CREATE OR REPLACE FUNCTION update_notification_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "NotificationAnalytics" (
    "shopId",
    "date",
    "inAppSent",
    "emailSent",
    "smsSent",
    "pushSent",
    "totalDelivered",
    "totalRead",
    "totalClicked"
  ) VALUES (
    NEW."shopId",
    CURRENT_DATE,
    CASE WHEN NEW."channel" = 'in_app' THEN 1 ELSE 0 END,
    CASE WHEN NEW."channel" = 'email' THEN 1 ELSE 0 END,
    CASE WHEN NEW."channel" = 'sms' THEN 1 ELSE 0 END,
    CASE WHEN NEW."channel" = 'push' THEN 1 ELSE 0 END,
    CASE WHEN NEW."status" = 'delivered' THEN 1 ELSE 0 END,
    CASE WHEN NEW."readAt" IS NOT NULL THEN 1 ELSE 0 END,
    CASE WHEN NEW."clickedAt" IS NOT NULL THEN 1 ELSE 0 END
  )
  ON CONFLICT ("shopId", "date")
  DO UPDATE SET
    "inAppSent" = "NotificationAnalytics"."inAppSent" + CASE WHEN NEW."channel" = 'in_app' THEN 1 ELSE 0 END,
    "emailSent" = "NotificationAnalytics"."emailSent" + CASE WHEN NEW."channel" = 'email' THEN 1 ELSE 0 END,
    "smsSent" = "NotificationAnalytics"."smsSent" + CASE WHEN NEW."channel" = 'sms' THEN 1 ELSE 0 END,
    "pushSent" = "NotificationAnalytics"."pushSent" + CASE WHEN NEW."channel" = 'push' THEN 1 ELSE 0 END,
    "totalDelivered" = "NotificationAnalytics"."totalDelivered" + CASE WHEN NEW."status" = 'delivered' THEN 1 ELSE 0 END,
    "totalRead" = "NotificationAnalytics"."totalRead" + CASE WHEN NEW."readAt" IS NOT NULL THEN 1 ELSE 0 END,
    "totalClicked" = "NotificationAnalytics"."totalClicked" + CASE WHEN NEW."clickedAt" IS NOT NULL THEN 1 ELSE 0 END,
    "updatedAt" = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_notification_analytics
AFTER INSERT OR UPDATE ON "Notification"
FOR EACH ROW
EXECUTE FUNCTION update_notification_analytics();

-- Auto-cleanup old events
CREATE OR REPLACE FUNCTION cleanup_expired_realtime_events()
RETURNS void AS $$
BEGIN
  DELETE FROM "RealtimeEvent"
  WHERE "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql;

-- Could be run via cron or scheduled job
-- SELECT cleanup_expired_realtime_events();
