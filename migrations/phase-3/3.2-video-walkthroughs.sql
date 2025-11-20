-- Phase 3.2: Video Walkthroughs
-- Enables estimators to record and attach video explanations to estimates

-- Create EstimateVideo table
CREATE TABLE IF NOT EXISTS "EstimateVideo" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "caption" TEXT,
  "uploadedBy" TEXT NOT NULL DEFAULT 'Shop User',
  "duration" INTEGER, -- Duration in seconds
  "fileSize" INTEGER, -- File size in bytes
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "EstimateVideo_estimateId_idx" ON "EstimateVideo"("estimateId");
CREATE INDEX IF NOT EXISTS "EstimateVideo_createdAt_idx" ON "EstimateVideo"("createdAt");

-- Add comments
COMMENT ON TABLE "EstimateVideo" IS 'Video walkthroughs attached to estimates';
COMMENT ON COLUMN "EstimateVideo"."duration" IS 'Video duration in seconds';
COMMENT ON COLUMN "EstimateVideo"."fileSize" IS 'Video file size in bytes';
