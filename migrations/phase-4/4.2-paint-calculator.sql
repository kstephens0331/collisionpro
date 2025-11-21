-- Phase 4.2: Paint Material Calculator
-- Professional paint calculation system for collision repair

-- Paint codes database (manufacturer colors)
CREATE TABLE IF NOT EXISTS "PaintCode" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "year" INT NOT NULL,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  "type" TEXT NOT NULL CHECK ("type" IN ('solid', 'metallic', 'pearl', 'tri-coat')),
  "baseCoatCost" DECIMAL(10,2) DEFAULT 0,
  "clearCoatCost" DECIMAL(10,2) DEFAULT 0,
  "primerCost" DECIMAL(10,2) DEFAULT 0,
  "materialCostPerPanel" DECIMAL(10,2) DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_paint_code_vehicle ON "PaintCode" ("year", "make", "model");
CREATE INDEX IF NOT EXISTS idx_paint_code_code ON "PaintCode" ("code");

-- Paint estimates (calculated per estimate)
CREATE TABLE IF NOT EXISTS "PaintEstimate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "estimateId" TEXT NOT NULL,
  "paintCodeId" TEXT,
  "colorName" TEXT,
  "paintCode" TEXT,
  "paintType" TEXT CHECK ("paintType" IN ('solid', 'metallic', 'pearl', 'tri-coat')),

  -- Panel counts
  "panelsToRepair" INT DEFAULT 0,
  "panelsToReplace" INT DEFAULT 0,
  "totalPanels" INT GENERATED ALWAYS AS ("panelsToRepair" + "panelsToReplace") STORED,

  -- Area calculations
  "squareFeet" DECIMAL(10,2) DEFAULT 0,

  -- Material costs
  "baseCoatCost" DECIMAL(10,2) DEFAULT 0,
  "clearCoatCost" DECIMAL(10,2) DEFAULT 0,
  "primerCost" DECIMAL(10,2) DEFAULT 0,
  "sealerCost" DECIMAL(10,2) DEFAULT 0,
  "reducerCost" DECIMAL(10,2) DEFAULT 0,
  "hardenerCost" DECIMAL(10,2) DEFAULT 0,
  "totalMaterialCost" DECIMAL(10,2) GENERATED ALWAYS AS (
    "baseCoatCost" + "clearCoatCost" + "primerCost" + "sealerCost" + "reducerCost" + "hardenerCost"
  ) STORED,

  -- Labor calculations
  "prepHours" DECIMAL(10,2) DEFAULT 0,
  "paintHours" DECIMAL(10,2) DEFAULT 0,
  "finishHours" DECIMAL(10,2) DEFAULT 0,
  "totalLaborHours" DECIMAL(10,2) GENERATED ALWAYS AS (
    "prepHours" + "paintHours" + "finishHours"
  ) STORED,

  -- Totals
  "laborRate" DECIMAL(10,2) DEFAULT 0,
  "totalLaborCost" DECIMAL(10,2) GENERATED ALWAYS AS (
    "totalLaborHours" * "laborRate"
  ) STORED,
  "totalCost" DECIMAL(10,2) GENERATED ALWAYS AS (
    "totalMaterialCost" + ("totalLaborHours" * "laborRate")
  ) STORED,

  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_estimate FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE,
  CONSTRAINT fk_paint_code FOREIGN KEY ("paintCodeId") REFERENCES "PaintCode"("id") ON DELETE SET NULL
);

-- Index for estimate lookups
CREATE INDEX IF NOT EXISTS idx_paint_estimate_estimate ON "PaintEstimate" ("estimateId");

-- Panel paint labor times (industry standard)
CREATE TABLE IF NOT EXISTS "PanelPaintTime" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "partName" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL CHECK ("category" IN ('panel', 'bumper', 'door', 'fender', 'hood', 'trunk', 'roof', 'quarter')),

  -- Labor times in hours (Mitchell/CCC ONE standards)
  "prepTime" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "paintTime" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "finishTime" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "blendTime" DECIMAL(10,2) DEFAULT 0, -- For adjacent panels

  -- Area for material calculation
  "squareFeet" DECIMAL(10,2) DEFAULT 0,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Seed common panel times
INSERT INTO "PanelPaintTime" ("partName", "category", "prepTime", "paintTime", "finishTime", "blendTime", "squareFeet")
VALUES
  -- Doors
  ('Front Door', 'door', 1.5, 1.0, 0.5, 0.5, 12.0),
  ('Rear Door', 'door', 1.5, 1.0, 0.5, 0.5, 12.0),

  -- Fenders
  ('Front Fender', 'fender', 1.8, 1.2, 0.6, 0.5, 15.0),
  ('Rear Fender/Quarter Panel', 'quarter', 3.0, 2.0, 1.0, 0.8, 25.0),

  -- Major panels
  ('Hood', 'hood', 2.0, 1.5, 0.7, 0.6, 20.0),
  ('Trunk/Deck Lid', 'trunk', 1.8, 1.2, 0.6, 0.5, 18.0),
  ('Roof', 'roof', 2.5, 2.0, 1.0, 0, 30.0),

  -- Bumpers
  ('Front Bumper Cover', 'bumper', 1.2, 0.8, 0.4, 0, 10.0),
  ('Rear Bumper Cover', 'bumper', 1.2, 0.8, 0.4, 0, 10.0),

  -- Mirrors and small parts
  ('Side Mirror', 'panel', 0.3, 0.2, 0.1, 0, 1.0),
  ('Grille', 'panel', 0.5, 0.3, 0.2, 0, 2.0),
  ('Rocker Panel', 'panel', 1.0, 0.8, 0.4, 0.3, 8.0)
ON CONFLICT ("partName") DO NOTHING;

-- Paint material pricing (per quart/gallon)
CREATE TABLE IF NOT EXISTS "PaintMaterialPricing" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL,
  "materialType" TEXT NOT NULL CHECK ("materialType" IN ('base-coat', 'clear-coat', 'primer', 'sealer', 'reducer', 'hardener')),
  "paintType" TEXT NOT NULL CHECK ("paintType" IN ('solid', 'metallic', 'pearl', 'tri-coat')),
  "costPerQuart" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "costPerGallon" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_shop FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE,
  UNIQUE ("shopId", "materialType", "paintType")
);

-- Default paint material pricing (example costs)
-- Shops can customize these values in settings
COMMENT ON TABLE "PaintMaterialPricing" IS 'Shop-specific paint material costs. Shops should update these with their actual supplier costs.';
COMMENT ON TABLE "PanelPaintTime" IS 'Industry-standard labor times for painting panels. Based on Mitchell/CCC ONE estimating guides.';
COMMENT ON TABLE "PaintEstimate" IS 'Calculated paint estimate for a repair job including materials and labor.';
COMMENT ON TABLE "PaintCode" IS 'Vehicle paint codes database for accurate color matching.';
