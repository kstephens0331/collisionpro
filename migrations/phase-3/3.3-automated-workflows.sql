-- Phase 3.3: Automated Workflows
-- Creates workflow templates for automated customer communication

-- Create WorkflowTemplate table
CREATE TABLE IF NOT EXISTS "WorkflowTemplate" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "trigger" TEXT NOT NULL, -- estimate_sent, job_started, job_completed, etc.
  "actions" JSONB NOT NULL, -- Array of workflow actions with delays
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "WorkflowTemplate_trigger_idx" ON "WorkflowTemplate"("trigger");
CREATE INDEX IF NOT EXISTS "WorkflowTemplate_isActive_idx" ON "WorkflowTemplate"("isActive");

-- Add comments
COMMENT ON TABLE "WorkflowTemplate" IS 'Automated workflow templates for customer communication';
COMMENT ON COLUMN "WorkflowTemplate"."trigger" IS 'Event that triggers the workflow';
COMMENT ON COLUMN "WorkflowTemplate"."actions" IS 'Array of workflow steps with delays and conditions';

-- Enable RLS
ALTER TABLE "WorkflowTemplate" ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "workflow_access" ON "WorkflowTemplate"
  FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON "WorkflowTemplate" TO authenticated;
GRANT ALL ON "WorkflowTemplate" TO service_role;
