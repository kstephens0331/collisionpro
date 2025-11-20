-- Phase 8.2: 3D Viewer Analytics
-- Track usage of 3D vehicle damage visualization

CREATE TABLE IF NOT EXISTS "Analytics3DViewer" (
  "id" TEXT PRIMARY KEY,

  -- Event details
  "event" TEXT NOT NULL, -- 'viewer_opened', 'marker_added', 'markers_saved', 'screenshot_captured', 'camera_changed'
  "estimateId" TEXT NOT NULL,

  -- Context data
  "vehicleType" TEXT,
  "markerCount" INTEGER,
  "damageType" TEXT,
  "cameraAngle" TEXT,

  -- Timestamp
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS "Analytics3DViewer_estimateId_idx" ON "Analytics3DViewer"("estimateId");
CREATE INDEX IF NOT EXISTS "Analytics3DViewer_event_idx" ON "Analytics3DViewer"("event");
CREATE INDEX IF NOT EXISTS "Analytics3DViewer_timestamp_idx" ON "Analytics3DViewer"("timestamp");

-- Enable RLS (optional - analytics can be shop-wide)
ALTER TABLE "Analytics3DViewer" ENABLE ROW LEVEL SECURITY;

-- Policy: Simple access for all
CREATE POLICY "analytics_3d_viewer_access"
  ON "Analytics3DViewer" FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON "Analytics3DViewer" TO authenticated;
GRANT ALL ON "Analytics3DViewer" TO service_role;

COMMENT ON TABLE "Analytics3DViewer" IS 'Tracks usage of 3D vehicle damage visualization feature';
COMMENT ON COLUMN "Analytics3DViewer"."event" IS 'Type of event: viewer_opened, marker_added, markers_saved, screenshot_captured, camera_changed';
COMMENT ON COLUMN "Analytics3DViewer"."estimateId" IS 'Reference to the estimate being viewed';
COMMENT ON COLUMN "Analytics3DViewer"."vehicleType" IS 'Type of vehicle model (sedan, suv, truck, coupe)';
COMMENT ON COLUMN "Analytics3DViewer"."markerCount" IS 'Number of markers when markers_saved event occurs';
COMMENT ON COLUMN "Analytics3DViewer"."damageType" IS 'Type of damage when marker_added event occurs';
COMMENT ON COLUMN "Analytics3DViewer"."cameraAngle" IS 'Camera preset when camera_changed event occurs';
