-- =============================================
-- Phase 3.1: Damage Annotations (3D Viewer)
-- =============================================
-- Creates table for storing 3D damage markers and annotations
-- Supports interactive damage marking on 3D vehicle models

-- Damage Annotations Table
CREATE TABLE IF NOT EXISTS "DamageAnnotation" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL,
  "vehicleType" TEXT NOT NULL DEFAULT 'sedan',
  "markers" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "cameraPosition" JSONB,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "DamageAnnotation_estimateId_idx"
  ON "DamageAnnotation"("estimateId");

CREATE INDEX IF NOT EXISTS "DamageAnnotation_createdAt_idx"
  ON "DamageAnnotation"("createdAt");

-- Comments
COMMENT ON TABLE "DamageAnnotation" IS 'Stores 3D damage markers and annotations for estimates';
COMMENT ON COLUMN "DamageAnnotation"."markers" IS 'Array of damage markers with position, type, severity, and description';
COMMENT ON COLUMN "DamageAnnotation"."cameraPosition" IS 'Saved camera position for viewing annotations';

-- Note: RLS policies will be added after Estimate and ShopMember tables exist
-- For now, the table is accessible via service role key only
