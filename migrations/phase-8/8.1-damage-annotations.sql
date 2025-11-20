-- Phase 8.1: 3D Vehicle Damage Visualization
-- Store 3D damage annotations for estimates

CREATE TABLE IF NOT EXISTS "DamageAnnotation" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "shopId" TEXT NOT NULL DEFAULT 'default',

  -- Vehicle model info
  "vehicleType" TEXT DEFAULT 'sedan', -- 'sedan', 'suv', 'truck', 'coupe'

  -- Damage markers (stored as JSONB array)
  "markers" JSONB NOT NULL DEFAULT '[]',
  -- Example marker structure:
  -- {
  --   "id": "marker_1",
  --   "position": {"x": 1.5, "y": 0.5, "z": 2.0},
  --   "damageType": "dent",
  --   "severity": "moderate",
  --   "description": "Large dent on driver door",
  --   "partName": "door_left_front",
  --   "color": "#fbbf24"
  -- }

  -- Camera state (save user's last view)
  "cameraPosition" JSONB,
  -- {
  --   "position": [5, 3, 5],
  --   "target": [0, 0.8, 0]
  -- }

  -- Metadata
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "DamageAnnotation_estimateId_idx" ON "DamageAnnotation"("estimateId");
CREATE INDEX IF NOT EXISTS "DamageAnnotation_shopId_idx" ON "DamageAnnotation"("shopId");
CREATE INDEX IF NOT EXISTS "DamageAnnotation_vehicleType_idx" ON "DamageAnnotation"("vehicleType");

-- GIN index for JSONB marker queries
CREATE INDEX IF NOT EXISTS "DamageAnnotation_markers_idx" ON "DamageAnnotation" USING GIN ("markers");

-- Enable RLS
ALTER TABLE "DamageAnnotation" ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Full multi-tenancy support
CREATE POLICY "Users can view their shop's damage annotations"
  ON "DamageAnnotation" FOR SELECT
  USING (
    "estimateId" IN (
      SELECT "id" FROM "Estimate" WHERE "shopId" IN (
        SELECT "id" FROM "Shop" WHERE "id" = auth.uid()::text
        OR "id" IN (SELECT "shopId" FROM "ShopUser" WHERE "userId" = auth.uid()::text)
      )
    )
  );

CREATE POLICY "Users can create damage annotations for their shop's estimates"
  ON "DamageAnnotation" FOR INSERT
  WITH CHECK (
    "estimateId" IN (
      SELECT "id" FROM "Estimate" WHERE "shopId" IN (
        SELECT "id" FROM "Shop" WHERE "id" = auth.uid()::text
        OR "id" IN (SELECT "shopId" FROM "ShopUser" WHERE "userId" = auth.uid()::text)
      )
    )
  );

CREATE POLICY "Users can update their shop's damage annotations"
  ON "DamageAnnotation" FOR UPDATE
  USING (
    "estimateId" IN (
      SELECT "id" FROM "Estimate" WHERE "shopId" IN (
        SELECT "id" FROM "Shop" WHERE "id" = auth.uid()::text
        OR "id" IN (SELECT "shopId" FROM "ShopUser" WHERE "userId" = auth.uid()::text)
      )
    )
  );

CREATE POLICY "Users can delete their shop's damage annotations"
  ON "DamageAnnotation" FOR DELETE
  USING (
    "estimateId" IN (
      SELECT "id" FROM "Estimate" WHERE "shopId" IN (
        SELECT "id" FROM "Shop" WHERE "id" = auth.uid()::text
        OR "id" IN (SELECT "shopId" FROM "ShopUser" WHERE "userId" = auth.uid()::text)
      )
    )
  );

-- Trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_damage_annotation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_damage_annotation_timestamp
  BEFORE UPDATE ON "DamageAnnotation"
  FOR EACH ROW
  EXECUTE FUNCTION update_damage_annotation_timestamp();

-- Grant permissions
GRANT ALL ON "DamageAnnotation" TO authenticated;
GRANT ALL ON "DamageAnnotation" TO service_role;

-- Comments
COMMENT ON TABLE "DamageAnnotation" IS '3D damage markers for vehicle visualization';
COMMENT ON COLUMN "DamageAnnotation"."markers" IS 'Array of damage marker objects with position, type, severity';
COMMENT ON COLUMN "DamageAnnotation"."vehicleType" IS 'Generic vehicle model type (sedan/suv/truck/coupe)';
COMMENT ON COLUMN "DamageAnnotation"."cameraPosition" IS 'Saved camera position and target for restore';
COMMENT ON COLUMN "DamageAnnotation"."estimateId" IS 'Reference to the estimate being annotated';
COMMENT ON COLUMN "DamageAnnotation"."shopId" IS 'Reference to the shop that owns this annotation';
