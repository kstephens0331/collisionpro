-- Phase 3.3: Photo Upload & Gallery
-- Run this in Supabase SQL Editor

-- Create Photo table for storing photo metadata
CREATE TABLE IF NOT EXISTS "Photo" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "category" TEXT NOT NULL, -- damage, progress, completed
  "caption" TEXT,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_photo_estimate" ON "Photo"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_photo_category" ON "Photo"("category");
CREATE INDEX IF NOT EXISTS "idx_photo_created" ON "Photo"("createdAt");

-- Enable RLS on Photo
ALTER TABLE "Photo" ENABLE ROW LEVEL SECURITY;

-- Create policy for Photo (shops can manage photos for their estimates)
CREATE POLICY "photo_shop_access" ON "Photo"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Estimate" e
      WHERE e."id" = "Photo"."estimateId"
    )
  );

-- Grant permissions
GRANT ALL ON "Photo" TO authenticated;
GRANT ALL ON "Photo" TO service_role;

-- Create storage bucket for photos (run this separately in Supabase Dashboard > Storage)
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create new bucket called "photos"
-- 3. Set it to public (for easier access)
-- 4. Add policies:
--    - Allow authenticated users to upload
--    - Allow public to view
