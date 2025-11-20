-- Phase 3.1: Add annotations column to Photo table
-- This enables the Photo Markup & Annotations feature

-- Add annotations column to store markup data
ALTER TABLE "Photo"
ADD COLUMN IF NOT EXISTS "annotations" JSONB DEFAULT '[]'::jsonb;

-- Add index for faster queries on photos with annotations
CREATE INDEX IF NOT EXISTS "Photo_annotations_idx" ON "Photo" USING GIN ("annotations");

-- Add comment
COMMENT ON COLUMN "Photo"."annotations" IS 'Stores photo markup annotations (circles, arrows, text, etc.)';
