-- =============================================
-- Job Assignment & Tracking System
-- =============================================
-- Extends technician management with workflow stages and job tracking

-- Workflow Stages Table (customizable workflow)
CREATE TABLE IF NOT EXISTS "WorkflowStage" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT DEFAULT '#3B82F6', -- Hex color for UI
  "icon" TEXT, -- Icon name for UI
  "order" INTEGER NOT NULL,
  "isStart" BOOLEAN DEFAULT false,
  "isComplete" BOOLEAN DEFAULT false,
  "requiresQC" BOOLEAN DEFAULT false,
  "notifyCustomer" BOOLEAN DEFAULT false,
  "estimatedDays" INTEGER, -- Expected time in this stage
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "order")
);

-- Default workflow stages seed data
INSERT INTO "WorkflowStage" ("id", "shopId", "name", "description", "color", "icon", "order", "isStart", "isComplete", "requiresQC") VALUES
  ('stage-check-in', 'shop-1', 'Check In', 'Vehicle arrival and inspection', '#6B7280', 'clipboard-check', 1, true, false, false),
  ('stage-disassembly', 'shop-1', 'Disassembly', 'Tear down and parts ordering', '#8B5CF6', 'wrench', 2, false, false, false),
  ('stage-parts-waiting', 'shop-1', 'Waiting for Parts', 'Awaiting parts delivery', '#F59E0B', 'package', 3, false, false, false),
  ('stage-body-work', 'shop-1', 'Body Work', 'Frame and body repair', '#3B82F6', 'hammer', 4, false, false, false),
  ('stage-paint-prep', 'shop-1', 'Paint Prep', 'Sanding and masking', '#EC4899', 'paint-brush', 5, false, false, false),
  ('stage-painting', 'shop-1', 'Painting', 'Paint application', '#10B981', 'palette', 6, false, false, false),
  ('stage-reassembly', 'shop-1', 'Reassembly', 'Putting vehicle back together', '#6366F1', 'cog', 7, false, false, false),
  ('stage-qc', 'shop-1', 'Quality Control', 'Final inspection', '#F97316', 'shield-check', 8, false, false, true),
  ('stage-detail', 'shop-1', 'Detail & Cleanup', 'Final wash and detail', '#14B8A6', 'sparkles', 9, false, false, false),
  ('stage-complete', 'shop-1', 'Complete', 'Ready for customer pickup', '#22C55E', 'check-circle', 10, false, true, false)
ON CONFLICT (id) DO NOTHING;

-- Job Board (links estimates to workflow stages)
CREATE TABLE IF NOT EXISTS "JobBoard" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "currentStageId" TEXT NOT NULL REFERENCES "WorkflowStage"("id"),

  -- Dates
  "startDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  "targetCompletionDate" TIMESTAMP,
  "actualCompletionDate" TIMESTAMP,

  -- Status
  "status" TEXT DEFAULT 'in-progress', -- in-progress, on-hold, completed, cancelled
  "priority" TEXT DEFAULT 'normal', -- low, normal, high, urgent
  "blockedReason" TEXT,
  "blockedSince" TIMESTAMP,

  -- Progress
  "progressPercentage" INTEGER DEFAULT 0,
  "daysInCurrentStage" INTEGER DEFAULT 0,

  -- Assignments
  "assignedTechnicians" TEXT[], -- Array of technician IDs

  -- Customer Communication
  "lastCustomerUpdate" TIMESTAMP,
  "customerNotificationsEnabled" BOOLEAN DEFAULT true,

  -- Metrics
  "totalElapsedDays" INTEGER DEFAULT 0,
  "onSchedule" BOOLEAN DEFAULT true,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("estimateId")
);

-- Job Stage History (audit trail of stage changes)
CREATE TABLE IF NOT EXISTS "JobStageHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobBoardId" TEXT NOT NULL REFERENCES "JobBoard"("id") ON DELETE CASCADE,
  "stageId" TEXT NOT NULL REFERENCES "WorkflowStage"("id"),
  "enteredAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "exitedAt" TIMESTAMP,
  "durationDays" INTEGER,
  "assignedTechnicians" TEXT[],
  "notes" TEXT,
  "completedBy" TEXT,
  "qcPassed" BOOLEAN,
  "qcNotes" TEXT
);

-- Job Notes/Comments
CREATE TABLE IF NOT EXISTS "JobNote" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobBoardId" TEXT NOT NULL REFERENCES "JobBoard"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "noteType" TEXT DEFAULT 'general', -- general, issue, delay, customer, internal
  "content" TEXT NOT NULL,
  "isInternal" BOOLEAN DEFAULT false, -- Hide from customer
  "isPinned" BOOLEAN DEFAULT false,
  "attachments" TEXT[], -- URLs to photos/documents
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Job Photos (additional to estimate photos)
CREATE TABLE IF NOT EXISTS "JobPhoto" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobBoardId" TEXT NOT NULL REFERENCES "JobBoard"("id") ON DELETE CASCADE,
  "stageId" TEXT REFERENCES "WorkflowStage"("id"),
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "photoType" TEXT DEFAULT 'progress', -- progress, issue, completion, before, after
  "uploadedBy" TEXT,
  "uploadedByName" TEXT,
  "uploadedAt" TIMESTAMP DEFAULT NOW()
);

-- Stage Checklist Templates
CREATE TABLE IF NOT EXISTS "StageChecklistTemplate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "stageId" TEXT NOT NULL REFERENCES "WorkflowStage"("id") ON DELETE CASCADE,
  "taskName" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL,
  "isMandatory" BOOLEAN DEFAULT true,
  "requiresPhoto" BOOLEAN DEFAULT false,
  "requiresApproval" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Job Checklist Items (per job instance)
CREATE TABLE IF NOT EXISTS "JobChecklist" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "jobBoardId" TEXT NOT NULL REFERENCES "JobBoard"("id") ON DELETE CASCADE,
  "stageId" TEXT NOT NULL REFERENCES "WorkflowStage"("id"),
  "taskName" TEXT NOT NULL,
  "description" TEXT,
  "isCompleted" BOOLEAN DEFAULT false,
  "completedBy" TEXT,
  "completedByName" TEXT,
  "completedAt" TIMESTAMP,
  "photoUrl" TEXT,
  "notes" TEXT,
  "requiresApproval" BOOLEAN DEFAULT false,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP
);

-- Job Bottleneck Analytics
CREATE TABLE IF NOT EXISTS "BottleneckLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "stageId" TEXT NOT NULL REFERENCES "WorkflowStage"("id"),
  "logDate" DATE NOT NULL,
  "avgDaysInStage" DECIMAL(10,2),
  "jobsInStage" INTEGER,
  "jobsOverdue" INTEGER,
  "bottleneckScore" INTEGER, -- 0-100, higher = worse bottleneck
  "createdAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "stageId", "logDate")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_board_estimate ON "JobBoard"("estimateId");
CREATE INDEX IF NOT EXISTS idx_job_board_shop ON "JobBoard"("shopId");
CREATE INDEX IF NOT EXISTS idx_job_board_stage ON "JobBoard"("currentStageId");
CREATE INDEX IF NOT EXISTS idx_job_board_status ON "JobBoard"("status");
CREATE INDEX IF NOT EXISTS idx_job_stage_history_job ON "JobStageHistory"("jobBoardId");
CREATE INDEX IF NOT EXISTS idx_job_stage_history_stage ON "JobStageHistory"("stageId");
CREATE INDEX IF NOT EXISTS idx_job_note_job ON "JobNote"("jobBoardId");
CREATE INDEX IF NOT EXISTS idx_job_photo_job ON "JobPhoto"("jobBoardId");
CREATE INDEX IF NOT EXISTS idx_job_checklist_job ON "JobChecklist"("jobBoardId");
CREATE INDEX IF NOT EXISTS idx_bottleneck_shop_date ON "BottleneckLog"("shopId", "logDate");

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_job_board_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_board_timestamp
BEFORE UPDATE ON "JobBoard"
FOR EACH ROW
EXECUTE FUNCTION update_job_board_timestamp();

-- Function to calculate days in current stage
CREATE OR REPLACE FUNCTION calculate_days_in_stage()
RETURNS TRIGGER AS $$
BEGIN
  -- Get most recent stage history entry
  SELECT EXTRACT(DAY FROM (NOW() - "enteredAt"))::INTEGER
  INTO NEW."daysInCurrentStage"
  FROM "JobStageHistory"
  WHERE "jobBoardId" = NEW."id"
    AND "exitedAt" IS NULL
  ORDER BY "enteredAt" DESC
  LIMIT 1;

  -- Calculate total elapsed days
  NEW."totalElapsedDays" = EXTRACT(DAY FROM (NOW() - NEW."startDate"))::INTEGER;

  -- Update progress percentage based on current stage order
  SELECT (ws."order"::FLOAT / (SELECT MAX("order") FROM "WorkflowStage" WHERE "shopId" = NEW."shopId") * 100)::INTEGER
  INTO NEW."progressPercentage"
  FROM "WorkflowStage" ws
  WHERE ws."id" = NEW."currentStageId";

  -- Check if on schedule
  IF NEW."targetCompletionDate" IS NOT NULL THEN
    NEW."onSchedule" = (NEW."targetCompletionDate" >= NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_job_metrics
BEFORE UPDATE ON "JobBoard"
FOR EACH ROW
EXECUTE FUNCTION calculate_days_in_stage();
