/**
 * Phase 8.3: Customer Communication Hub
 *
 * Comprehensive customer communication system with messaging,
 * appointments, automated reminders, and communication preferences
 */

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE message_type AS ENUM ('sms', 'email', 'in_app', 'phone_call');
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE reminder_type AS ENUM ('appointment', 'pickup', 'payment_due', 'inspection_due', 'custom');
CREATE TYPE communication_preference AS ENUM ('sms', 'email', 'phone', 'in_app', 'none');

-- ============================================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================================

-- Customer Conversations
CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE CASCADE,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,

  "subject" TEXT,
  "status" TEXT DEFAULT 'active', -- 'active', 'closed', 'archived'
  "priority" TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  "assignedTo" TEXT, -- User ID of shop staff

  -- Tracking
  "lastMessageAt" TIMESTAMP,
  "messageCount" INTEGER DEFAULT 0,
  "unreadCount" INTEGER DEFAULT 0,

  -- Tags & Categories
  "tags" TEXT[],
  "category" TEXT, -- 'general', 'estimate', 'repair_status', 'complaint', 'inquiry'

  -- Metadata
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_conversation_customer" ON "Conversation"("customerId");
CREATE INDEX IF NOT EXISTS "idx_conversation_shop" ON "Conversation"("shopId");
CREATE INDEX IF NOT EXISTS "idx_conversation_estimate" ON "Conversation"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_conversation_status" ON "Conversation"("status", "lastMessageAt" DESC);

-- Messages
CREATE TABLE IF NOT EXISTS "Message" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE CASCADE,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Message Details
  "type" message_type NOT NULL,
  "direction" message_direction NOT NULL,
  "status" message_status DEFAULT 'pending',

  -- Content
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "htmlBody" TEXT,

  -- Sender/Recipient
  "senderId" TEXT, -- User ID if outbound from shop
  "senderName" TEXT,
  "recipientEmail" TEXT,
  "recipientPhone" TEXT,

  -- Delivery Tracking
  "sentAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "readAt" TIMESTAMP,
  "failedAt" TIMESTAMP,
  "errorMessage" TEXT,

  -- Attachments & Media
  "attachments" JSONB DEFAULT '[]'::jsonb, -- [{url, filename, size, type}]
  "mediaUrls" TEXT[],

  -- References
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,
  "appointmentId" TEXT,
  "inReplyTo" TEXT, -- Message ID this is replying to

  -- Metadata
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_message_conversation" ON "Message"("conversationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_message_customer" ON "Message"("customerId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_message_type_status" ON "Message"("type", "status");
CREATE INDEX IF NOT EXISTS "idx_message_unread" ON "Message"("readAt") WHERE "readAt" IS NULL AND "direction" = 'inbound';

-- ============================================================================
-- APPOINTMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Appointment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE CASCADE,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,

  -- Appointment Details
  "title" TEXT NOT NULL,
  "description" TEXT,
  "appointmentType" TEXT NOT NULL, -- 'estimate', 'drop_off', 'pickup', 'inspection', 'consultation'

  -- Scheduling
  "scheduledStart" TIMESTAMP NOT NULL,
  "scheduledEnd" TIMESTAMP NOT NULL,
  "duration" INTEGER, -- Minutes
  "timezone" TEXT DEFAULT 'America/New_York',

  -- Status
  "status" appointment_status DEFAULT 'scheduled',
  "confirmedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "cancelledAt" TIMESTAMP,
  "cancellationReason" TEXT,

  -- Assignment
  "assignedTo" TEXT, -- Technician/staff user ID
  "assignedToName" TEXT,

  -- Location
  "location" TEXT, -- Shop address or custom
  "isRemote" BOOLEAN DEFAULT false,
  "meetingUrl" TEXT,

  -- Customer Info
  "customerName" TEXT,
  "customerEmail" TEXT,
  "customerPhone" TEXT,
  "customerNotes" TEXT,

  -- Vehicle Info
  "vehicleMake" TEXT,
  "vehicleModel" TEXT,
  "vehicleYear" INTEGER,
  "vehicleVin" TEXT,

  -- Reminders
  "reminderSent" BOOLEAN DEFAULT false,
  "reminderSentAt" TIMESTAMP,
  "confirmationReminderSent" BOOLEAN DEFAULT false,

  -- Metadata
  "notes" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_appointment_customer" ON "Appointment"("customerId");
CREATE INDEX IF NOT EXISTS "idx_appointment_shop" ON "Appointment"("shopId", "scheduledStart");
CREATE INDEX IF NOT EXISTS "idx_appointment_status" ON "Appointment"("status", "scheduledStart");
CREATE INDEX IF NOT EXISTS "idx_appointment_assigned" ON "Appointment"("assignedTo", "scheduledStart");

-- ============================================================================
-- REMINDERS & AUTOMATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AutomatedReminder" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE CASCADE,

  -- Reminder Details
  "type" reminder_type NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,

  -- Scheduling
  "scheduledFor" TIMESTAMP NOT NULL,
  "timezone" TEXT DEFAULT 'America/New_York',

  -- Delivery
  "deliveryMethod" communication_preference DEFAULT 'sms',
  "recipientEmail" TEXT,
  "recipientPhone" TEXT,

  -- Status
  "status" TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
  "sentAt" TIMESTAMP,
  "failedAt" TIMESTAMP,
  "errorMessage" TEXT,

  -- References
  "appointmentId" TEXT REFERENCES "Appointment"("id") ON DELETE CASCADE,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE CASCADE,

  -- Retry Logic
  "retryCount" INTEGER DEFAULT 0,
  "maxRetries" INTEGER DEFAULT 3,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_reminder_scheduled" ON "AutomatedReminder"("scheduledFor", "status");
CREATE INDEX IF NOT EXISTS "idx_reminder_customer" ON "AutomatedReminder"("customerId");
CREATE INDEX IF NOT EXISTS "idx_reminder_pending" ON "AutomatedReminder"("status") WHERE "status" = 'pending';

-- ============================================================================
-- CUSTOMER PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CustomerCommunicationPreference" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "customerId" TEXT UNIQUE REFERENCES "Customer"("id") ON DELETE CASCADE,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Preferred Methods
  "preferredMethod" communication_preference DEFAULT 'email',
  "allowSms" BOOLEAN DEFAULT true,
  "allowEmail" BOOLEAN DEFAULT true,
  "allowPhone" BOOLEAN DEFAULT true,
  "allowInApp" BOOLEAN DEFAULT true,

  -- Contact Info Preferences
  "primaryPhone" TEXT,
  "primaryEmail" TEXT,
  "alternatePhone" TEXT,
  "alternateEmail" TEXT,

  -- Notification Preferences
  "notifyOnEstimateReady" BOOLEAN DEFAULT true,
  "notifyOnEstimateApproved" BOOLEAN DEFAULT true,
  "notifyOnRepairStart" BOOLEAN DEFAULT true,
  "notifyOnRepairComplete" BOOLEAN DEFAULT true,
  "notifyOnPaymentDue" BOOLEAN DEFAULT true,
  "notifyOnAppointmentReminder" BOOLEAN DEFAULT true,

  -- Quiet Hours
  "quietHoursEnabled" BOOLEAN DEFAULT false,
  "quietHoursStart" TIME,
  "quietHoursEnd" TIME,
  "quietHoursTimezone" TEXT DEFAULT 'America/New_York',

  -- Marketing
  "allowMarketing" BOOLEAN DEFAULT false,
  "allowSurveys" BOOLEAN DEFAULT true,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_customer_comm_pref_customer" ON "CustomerCommunicationPreference"("customerId");

-- ============================================================================
-- COMMUNICATION TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "CommunicationTemplate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Template Details
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT, -- 'appointment', 'estimate', 'reminder', 'marketing'
  "type" message_type NOT NULL,

  -- Content
  "subject" TEXT,
  "body" TEXT NOT NULL,
  "htmlBody" TEXT,

  -- Variables
  "variables" JSONB DEFAULT '[]'::jsonb, -- ['customer_name', 'appointment_date', etc.]

  -- Settings
  "isActive" BOOLEAN DEFAULT true,
  "isDefault" BOOLEAN DEFAULT false,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "name")
);

CREATE INDEX IF NOT EXISTS "idx_comm_template_shop" ON "CommunicationTemplate"("shopId", "category");

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update conversation on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Conversation"
  SET
    "lastMessageAt" = NEW."createdAt",
    "messageCount" = "messageCount" + 1,
    "unreadCount" = CASE
      WHEN NEW."direction" = 'inbound' THEN "unreadCount" + 1
      ELSE "unreadCount"
    END,
    "updatedAt" = NOW()
  WHERE "id" = NEW."conversationId";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON "Message"
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Auto-create conversation if doesn't exist
CREATE OR REPLACE FUNCTION auto_create_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."conversationId" IS NULL THEN
    INSERT INTO "Conversation" ("customerId", "shopId", "estimateId", "status", "messageCount")
    VALUES (NEW."customerId", NEW."shopId", NEW."estimateId", 'active', 0)
    RETURNING "id" INTO NEW."conversationId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_conversation
  BEFORE INSERT ON "Message"
  FOR EACH ROW
  WHEN (NEW."conversationId" IS NULL)
  EXECUTE FUNCTION auto_create_conversation();

-- Update appointment timestamp
CREATE OR REPLACE FUNCTION update_appointment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();

  -- Set confirmed timestamp
  IF NEW."status" = 'confirmed' AND OLD."status" != 'confirmed' THEN
    NEW."confirmedAt" = NOW();
  END IF;

  -- Set completed timestamp
  IF NEW."status" = 'completed' AND OLD."status" != 'completed' THEN
    NEW."completedAt" = NOW();
  END IF;

  -- Set cancelled timestamp
  IF NEW."status" = 'cancelled' AND OLD."status" != 'cancelled' THEN
    NEW."cancelledAt" = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_timestamp
  BEFORE UPDATE ON "Appointment"
  FOR EACH ROW
  EXECUTE FUNCTION update_appointment_timestamp();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get unread messages for customer
CREATE OR REPLACE FUNCTION get_unread_messages(p_customer_id TEXT)
RETURNS TABLE (
  conversation_id TEXT,
  message_count BIGINT,
  last_message TEXT,
  last_message_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m."conversationId",
    COUNT(*)::BIGINT,
    MAX(m."body"),
    MAX(m."createdAt")
  FROM "Message" m
  WHERE m."customerId" = p_customer_id
    AND m."direction" = 'inbound'
    AND m."readAt" IS NULL
  GROUP BY m."conversationId"
  ORDER BY MAX(m."createdAt") DESC;
END;
$$ LANGUAGE plpgsql;

-- Get upcoming appointments
CREATE OR REPLACE FUNCTION get_upcoming_appointments(
  p_shop_id TEXT,
  p_days_ahead INTEGER DEFAULT 7
)
RETURNS TABLE (
  id TEXT,
  customer_name TEXT,
  appointment_type TEXT,
  scheduled_start TIMESTAMP,
  status appointment_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a."id",
    a."customerName",
    a."appointmentType",
    a."scheduledStart",
    a."status"
  FROM "Appointment" a
  WHERE a."shopId" = p_shop_id
    AND a."scheduledStart" BETWEEN NOW() AND NOW() + (p_days_ahead || ' days')::INTERVAL
    AND a."status" IN ('scheduled', 'confirmed')
  ORDER BY a."scheduledStart" ASC;
END;
$$ LANGUAGE plpgsql;

-- Get pending reminders
CREATE OR REPLACE FUNCTION get_pending_reminders()
RETURNS TABLE (
  id TEXT,
  type reminder_type,
  scheduled_for TIMESTAMP,
  customer_id TEXT,
  delivery_method communication_preference
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r."id",
    r."type",
    r."scheduledFor",
    r."customerId",
    r."deliveryMethod"
  FROM "AutomatedReminder" r
  WHERE r."status" = 'pending'
    AND r."scheduledFor" <= NOW()
    AND r."retryCount" < r."maxRetries"
  ORDER BY r."scheduledFor" ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

COMMENT ON TABLE "Conversation" IS 'Customer conversation threads with message tracking';
COMMENT ON TABLE "Message" IS 'Individual messages across all communication channels';
COMMENT ON TABLE "Appointment" IS 'Customer appointments with automated reminders';
COMMENT ON TABLE "AutomatedReminder" IS 'Scheduled automated reminders for customers';
COMMENT ON TABLE "CustomerCommunicationPreference" IS 'Customer communication preferences and opt-in settings';
COMMENT ON TABLE "CommunicationTemplate" IS 'Reusable message templates with variable substitution';
