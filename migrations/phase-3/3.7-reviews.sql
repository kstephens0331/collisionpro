-- Phase 3.7: Review Request Automation
-- Run this in Supabase SQL Editor

-- Create Review table for customer reviews
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "shopId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
  "comment" TEXT,
  "serviceQuality" INTEGER CHECK ("serviceQuality" >= 1 AND "serviceQuality" <= 5),
  "communication" INTEGER CHECK ("communication" >= 1 AND "communication" <= 5),
  "timeliness" INTEGER CHECK ("timeliness" >= 1 AND "timeliness" <= 5),
  "wouldRecommend" BOOLEAN,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "reviewRequestSentAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_review_customer" ON "Review"("customerId");
CREATE INDEX IF NOT EXISTS "idx_review_estimate" ON "Review"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_review_shop" ON "Review"("shopId");
CREATE INDEX IF NOT EXISTS "idx_review_rating" ON "Review"("rating");
CREATE INDEX IF NOT EXISTS "idx_review_created" ON "Review"("createdAt");

-- Add review tracking columns to Estimate
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "reviewRequested" BOOLEAN DEFAULT false;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "reviewRequestedAt" TIMESTAMP;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "reviewId" TEXT REFERENCES "Review"("id");

-- Enable RLS
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "review_access" ON "Review"
  FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON "Review" TO authenticated;
GRANT ALL ON "Review" TO service_role;
