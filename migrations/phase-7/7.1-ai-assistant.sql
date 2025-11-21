-- =============================================
-- AI Assistant System
-- =============================================
-- Conversational AI for shop assistance, parts search,
-- estimate creation, and business intelligence

-- Conversation Management
CREATE TABLE IF NOT EXISTS "AssistantConversation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Conversation metadata
  "title" TEXT,
  "context" JSONB DEFAULT '{}'::jsonb,
  "status" TEXT DEFAULT 'active', -- active, archived, deleted

  -- Analytics
  "messageCount" INTEGER DEFAULT 0,
  "lastMessageAt" TIMESTAMP,
  "totalTokens" INTEGER DEFAULT 0,
  "totalCost" DECIMAL(10,4) DEFAULT 0,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Individual Messages
CREATE TABLE IF NOT EXISTS "AssistantMessage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "conversationId" TEXT NOT NULL REFERENCES "AssistantConversation"("id") ON DELETE CASCADE,

  -- Message content
  "role" TEXT NOT NULL, -- user, assistant, system
  "content" TEXT NOT NULL,
  "contentType" TEXT DEFAULT 'text', -- text, tool_call, tool_result

  -- AI metadata
  "model" TEXT, -- gpt-4, gpt-3.5-turbo, etc.
  "tokens" INTEGER,
  "cost" DECIMAL(10,4),

  -- Tool/Action execution
  "toolCalls" JSONB, -- Array of tool calls made
  "toolResults" JSONB, -- Results from tool execution

  -- User feedback
  "feedback" TEXT, -- thumbs_up, thumbs_down, null
  "feedbackNote" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- AI Actions/Tool Calls Log
CREATE TABLE IF NOT EXISTS "AssistantAction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "messageId" TEXT REFERENCES "AssistantMessage"("id") ON DELETE CASCADE,
  "conversationId" TEXT NOT NULL REFERENCES "AssistantConversation"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "shopId" TEXT,

  -- Action details
  "actionType" TEXT NOT NULL, -- search_parts, create_estimate, send_notification, etc.
  "actionName" TEXT NOT NULL,
  "parameters" JSONB NOT NULL,
  "result" JSONB,

  -- Execution metadata
  "status" TEXT DEFAULT 'pending', -- pending, success, error
  "error" TEXT,
  "executionTime" INTEGER, -- milliseconds

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "completedAt" TIMESTAMP
);

-- AI Usage Analytics
CREATE TABLE IF NOT EXISTS "AssistantUsage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "shopId" TEXT,
  "date" DATE NOT NULL,

  -- Usage metrics
  "conversationsStarted" INTEGER DEFAULT 0,
  "messagesCount" INTEGER DEFAULT 0,
  "actionsExecuted" INTEGER DEFAULT 0,
  "totalTokens" INTEGER DEFAULT 0,
  "totalCost" DECIMAL(10,4) DEFAULT 0,

  -- Action breakdown
  "partSearches" INTEGER DEFAULT 0,
  "estimatesCreated" INTEGER DEFAULT 0,
  "reportsGenerated" INTEGER DEFAULT 0,
  "questionsAnswered" INTEGER DEFAULT 0,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("userId", "shopId", "date")
);

-- AI Prompt Templates
CREATE TABLE IF NOT EXISTS "AssistantPrompt" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL, -- system, estimate, parts, tax, general
  "template" TEXT NOT NULL,
  "description" TEXT,

  -- Variables that can be injected
  "variables" TEXT[], -- shop_name, user_name, date, etc.

  "isActive" BOOLEAN DEFAULT true,
  "version" INTEGER DEFAULT 1,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Seed default prompts
INSERT INTO "AssistantPrompt" ("id", "name", "category", "template", "description", "variables") VALUES
(
  'prompt-system-main',
  'Main System Prompt',
  'system',
  'You are an AI assistant for CollisionPro, a collision repair shop management system. You help shop owners and estimators with:

1. **Parts Search**: Find parts across multiple suppliers (RockAuto, AutoZone, NAPA, O''Reilly, LKQ)
2. **Estimate Creation**: Guide users through creating collision repair estimates
3. **Business Intelligence**: Answer questions about shop performance, revenue, jobs
4. **Tax & Accounting**: Help with tax deductions, quarterly estimates, financial reports
5. **Workflow**: Assign technicians, track jobs, manage DRP compliance

**Current Context**:
- Shop: {{shop_name}}
- User: {{user_name}}
- Date: {{current_date}}

Be concise, professional, and action-oriented. When users ask to do something, use the available tools to complete the action.',
  'Main system prompt for AI assistant',
  ARRAY['shop_name', 'user_name', 'current_date']
),
(
  'prompt-parts-search',
  'Parts Search Prompt',
  'parts',
  'I''ll help you search for that part across multiple suppliers. Let me check RockAuto, AutoZone, NAPA, O''Reilly, and LKQ for the best prices and availability.

What I need:
- Year, Make, Model
- Part type (e.g., "front bumper", "headlight", "door panel")
- Quality preference (OEM, aftermarket, used)',
  'Guide for helping with parts searches',
  ARRAY['year', 'make', 'model', 'part_type']
),
(
  'prompt-tax-assistant',
  'Tax Assistant Prompt',
  'tax',
  'I can help you with collision shop tax matters:

**Deductions**: Shop supplies, equipment depreciation, rent, utilities, marketing
**Quarterly Estimates**: Calculate based on your YTD revenue and expenses
**Tax Reports**: Generate Schedule C data, depreciation schedules
**Sales Tax**: Manage rates and compliance

What would you like help with?',
  'Tax-specific assistance prompt',
  ARRAY[]
),
(
  'prompt-estimate-creation',
  'Estimate Creation Guide',
  'estimate',
  'Let''s create a new estimate. I''ll guide you through:

1. **Customer Information**: Name, contact, vehicle details
2. **Damage Assessment**: Use 2D diagrams to mark damage
3. **Parts & Labor**: Search parts, calculate labor times
4. **Paint & Materials**: Calculate paint materials needed
5. **Totals & Tax**: Apply tax and generate final estimate

We can start with the VIN lookup if you have it, or enter details manually.',
  'Guide for creating estimates',
  ARRAY['vin']
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_user ON "AssistantConversation"("userId");
CREATE INDEX IF NOT EXISTS idx_conversation_shop ON "AssistantConversation"("shopId");
CREATE INDEX IF NOT EXISTS idx_conversation_status ON "AssistantConversation"("status");
CREATE INDEX IF NOT EXISTS idx_message_conversation ON "AssistantMessage"("conversationId");
CREATE INDEX IF NOT EXISTS idx_message_created ON "AssistantMessage"("createdAt");
CREATE INDEX IF NOT EXISTS idx_action_conversation ON "AssistantAction"("conversationId");
CREATE INDEX IF NOT EXISTS idx_action_type ON "AssistantAction"("actionType");
CREATE INDEX IF NOT EXISTS idx_action_status ON "AssistantAction"("status");
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON "AssistantUsage"("userId", "date");
CREATE INDEX IF NOT EXISTS idx_usage_shop_date ON "AssistantUsage"("shopId", "date");

-- Trigger to update conversation metadata
CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "AssistantConversation"
  SET
    "messageCount" = "messageCount" + 1,
    "lastMessageAt" = NOW(),
    "totalTokens" = "totalTokens" + COALESCE(NEW."tokens", 0),
    "totalCost" = "totalCost" + COALESCE(NEW."cost", 0),
    "updatedAt" = NOW()
  WHERE "id" = NEW."conversationId";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON "AssistantMessage"
FOR EACH ROW
EXECUTE FUNCTION update_conversation_metadata();

-- Trigger to update daily usage stats
CREATE OR REPLACE FUNCTION update_assistant_usage()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "AssistantUsage" (
    "userId",
    "shopId",
    "date",
    "messagesCount",
    "totalTokens",
    "totalCost"
  ) VALUES (
    (SELECT "userId" FROM "AssistantConversation" WHERE "id" = NEW."conversationId"),
    (SELECT "shopId" FROM "AssistantConversation" WHERE "id" = NEW."conversationId"),
    CURRENT_DATE,
    1,
    COALESCE(NEW."tokens", 0),
    COALESCE(NEW."cost", 0)
  )
  ON CONFLICT ("userId", "shopId", "date")
  DO UPDATE SET
    "messagesCount" = "AssistantUsage"."messagesCount" + 1,
    "totalTokens" = "AssistantUsage"."totalTokens" + COALESCE(NEW."tokens", 0),
    "totalCost" = "AssistantUsage"."totalCost" + COALESCE(NEW."cost", 0),
    "updatedAt" = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_assistant_usage
AFTER INSERT ON "AssistantMessage"
FOR EACH ROW
EXECUTE FUNCTION update_assistant_usage();
