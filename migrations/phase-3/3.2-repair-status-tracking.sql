-- Phase 3.2: Repair Status Tracking
-- Run this in Supabase SQL Editor

-- Create RepairStatus table for tracking status history
CREATE TABLE IF NOT EXISTS "RepairStatus" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_repair_status_estimate" ON "RepairStatus"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_repair_status_created" ON "RepairStatus"("createdAt");

-- Add estimatedCompletion column to Estimate if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Estimate' AND column_name = 'estimatedCompletion'
  ) THEN
    ALTER TABLE "Estimate" ADD COLUMN "estimatedCompletion" DATE;
  END IF;
END $$;

-- Ensure status column exists on Estimate (may already exist from 3.1)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Estimate' AND column_name = 'status'
  ) THEN
    ALTER TABLE "Estimate" ADD COLUMN "status" TEXT DEFAULT 'draft';
  END IF;
END $$;

-- Enable RLS on RepairStatus
ALTER TABLE "RepairStatus" ENABLE ROW LEVEL SECURITY;

-- Create policy for RepairStatus (shops can manage their own)
CREATE POLICY "repair_status_shop_access" ON "RepairStatus"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Estimate" e
      WHERE e."id" = "RepairStatus"."estimateId"
    )
  );

-- Grant permissions
GRANT ALL ON "RepairStatus" TO authenticated;
GRANT ALL ON "RepairStatus" TO service_role;
