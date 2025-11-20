-- Phase 9.1: Comprehensive Parts Catalog & Manuals Database
-- Creates tables for OEM parts, aftermarket parts, diagrams, and manuals

-- Vehicle Make/Model Database
CREATE TABLE IF NOT EXISTS "VehicleMake" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE, -- Toyota, Honda, Ford, etc.
  "country" TEXT, -- Japan, USA, Germany, etc.
  "logoUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "VehicleModel" (
  "id" TEXT PRIMARY KEY,
  "makeId" TEXT NOT NULL REFERENCES "VehicleMake"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL, -- Camry, Accord, F-150, etc.
  "year" INTEGER NOT NULL,
  "bodyStyle" TEXT, -- sedan, suv, truck, coupe, van
  "trim" TEXT, -- LE, XLE, Sport, Limited, etc.
  "engine" TEXT, -- 2.5L 4-cyl, 3.5L V6, etc.
  "transmission" TEXT, -- Auto, Manual, CVT
  "drivetrain" TEXT, -- FWD, RWD, AWD, 4WD

  -- Metadata
  "vin" TEXT, -- Sample VIN for reference
  "imageUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for Vehicle lookups
CREATE INDEX IF NOT EXISTS "VehicleModel_makeId_idx" ON "VehicleModel"("makeId");
CREATE INDEX IF NOT EXISTS "VehicleModel_year_idx" ON "VehicleModel"("year");
CREATE INDEX IF NOT EXISTS "VehicleModel_bodyStyle_idx" ON "VehicleModel"("bodyStyle");

-- OEM Parts Catalog
CREATE TABLE IF NOT EXISTS "OEMPart" (
  "id" TEXT PRIMARY KEY,
  "makeId" TEXT NOT NULL REFERENCES "VehicleMake"("id"),

  -- Part identification
  "partNumber" TEXT NOT NULL UNIQUE, -- Manufacturer part number
  "partName" TEXT NOT NULL,
  "category" TEXT NOT NULL, -- body, engine, suspension, electrical, interior, etc.
  "subcategory" TEXT, -- door, fender, hood, bumper, headlight, etc.

  -- Part details
  "description" TEXT,
  "weight" DECIMAL(10, 2), -- in lbs
  "dimensions" JSONB, -- {length, width, height} in inches
  "material" TEXT, -- steel, aluminum, plastic, fiberglass, carbon fiber

  -- Pricing
  "msrp" DECIMAL(10, 2),
  "wholesalePrice" DECIMAL(10, 2),
  "laborHours" DECIMAL(5, 2), -- Estimated labor time

  -- Compatibility
  "compatibleModels" TEXT[], -- Array of VehicleModel IDs
  "yearStart" INTEGER,
  "yearEnd" INTEGER,

  -- Media
  "imageUrl" TEXT,
  "diagramUrl" TEXT, -- Link to parts diagram
  "manualUrl" TEXT, -- Link to installation manual

  -- Inventory
  "inStock" BOOLEAN DEFAULT true,
  "discontinued" BOOLEAN DEFAULT false,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Aftermarket Parts Catalog
CREATE TABLE IF NOT EXISTS "AftermarketPart" (
  "id" TEXT PRIMARY KEY,
  "manufacturer" TEXT NOT NULL, -- LKQ, Keystone, etc.

  -- Part identification
  "partNumber" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "subcategory" TEXT,

  -- OEM equivalent
  "oemPartNumber" TEXT, -- References OEMPart
  "oemEquivalent" BOOLEAN DEFAULT true,

  -- Quality rating
  "quality" TEXT, -- OEM, Premium, Standard, Economy
  "certification" TEXT[], -- CAPA, NSF, ISO certified

  -- Part details
  "description" TEXT,
  "weight" DECIMAL(10, 2),
  "material" TEXT,

  -- Pricing
  "price" DECIMAL(10, 2),
  "wholesalePrice" DECIMAL(10, 2),

  -- Compatibility
  "compatibleModels" TEXT[],
  "yearStart" INTEGER,
  "yearEnd" INTEGER,

  -- Media
  "imageUrl" TEXT,

  -- Inventory
  "inStock" BOOLEAN DEFAULT true,
  "availabilityDays" INTEGER DEFAULT 0, -- Days to ship

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Parts Diagrams (Exploded view diagrams)
CREATE TABLE IF NOT EXISTS "PartsDiagram" (
  "id" TEXT PRIMARY KEY,
  "vehicleModelId" TEXT REFERENCES "VehicleModel"("id") ON DELETE CASCADE,

  -- Diagram info
  "title" TEXT NOT NULL,
  "section" TEXT NOT NULL, -- Front End, Rear End, Interior, Engine, etc.
  "imageUrl" TEXT NOT NULL,
  "pdfUrl" TEXT, -- High-res PDF version

  -- Diagram data (SVG coordinates for clickable parts)
  "partsMap" JSONB, -- {partNumber: {x, y, label}}

  -- Metadata
  "source" TEXT, -- OEM, Haynes, Chilton, etc.
  "year" INTEGER,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Service Manuals & Repair Procedures
CREATE TABLE IF NOT EXISTS "ServiceManual" (
  "id" TEXT PRIMARY KEY,
  "vehicleModelId" TEXT REFERENCES "VehicleModel"("id") ON DELETE CASCADE,

  -- Manual info
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- Factory Service Manual, Haynes, Chilton, Mitchell, etc.
  "category" TEXT, -- Body, Engine, Electrical, etc.

  -- Content
  "pdfUrl" TEXT,
  "pageCount" INTEGER,
  "fileSize" INTEGER, -- in MB

  -- Procedures (searchable)
  "procedures" JSONB, -- [{name, page, description}]

  -- Metadata
  "year" INTEGER,
  "publisher" TEXT,
  "isbn" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Paint Codes Database
CREATE TABLE IF NOT EXISTS "PaintCode" (
  "id" TEXT PRIMARY KEY,
  "makeId" TEXT NOT NULL REFERENCES "VehicleMake"("id"),

  -- Paint code
  "code" TEXT NOT NULL, -- 040, 1G3, NH-603P, etc.
  "name" TEXT NOT NULL, -- Super White, Platinum White Pearl, etc.
  "hexColor" TEXT, -- #FFFFFF for display

  -- Paint type
  "type" TEXT, -- Solid, Metallic, Pearl, Tri-coat
  "finish" TEXT, -- Gloss, Matte, Satin

  -- Compatibility
  "years" INTEGER[],
  "models" TEXT[],

  -- Paint details
  "manufacturer" TEXT, -- PPG, DuPont, BASF, etc.
  "formula" JSONB, -- Paint mixing formula

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Labor Time Guide (Mitchell, Motor, etc.)
CREATE TABLE IF NOT EXISTS "LaborTimeGuide" (
  "id" TEXT PRIMARY KEY,
  "vehicleModelId" TEXT REFERENCES "VehicleModel"("id"),

  -- Operation
  "operation" TEXT NOT NULL, -- "Replace Front Bumper", "R&I Door Panel"
  "operationCode" TEXT, -- Standard labor code (e.g., Mitchell code)
  "category" TEXT NOT NULL, -- body, mechanical, electrical

  -- Time (in hours)
  "timeStandard" DECIMAL(5, 2), -- Book time
  "timeWithPaint" DECIMAL(5, 2), -- If paint/refinish required
  "timeRemoveInstall" DECIMAL(5, 2), -- R&I time

  -- Notes
  "notes" TEXT,
  "difficulty" TEXT, -- Easy, Moderate, Difficult, Expert

  -- Source
  "source" TEXT, -- Mitchell, Motor, Chilton, etc.
  "sourceUrl" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Parts cross-reference (OEM to Aftermarket)
CREATE TABLE IF NOT EXISTS "PartsCrossReference" (
  "id" TEXT PRIMARY KEY,
  "oemPartNumber" TEXT NOT NULL,
  "aftermarketPartNumber" TEXT NOT NULL,
  "manufacturer" TEXT NOT NULL,
  "quality" TEXT, -- Premium, Standard, Economy
  "verified" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS "OEMPart_partNumber_idx" ON "OEMPart"("partNumber");
CREATE INDEX IF NOT EXISTS "OEMPart_category_idx" ON "OEMPart"("category");
CREATE INDEX IF NOT EXISTS "OEMPart_makeId_idx" ON "OEMPart"("makeId");
CREATE INDEX IF NOT EXISTS "AftermarketPart_partNumber_idx" ON "AftermarketPart"("partNumber");
CREATE INDEX IF NOT EXISTS "AftermarketPart_oemPartNumber_idx" ON "AftermarketPart"("oemPartNumber");
CREATE INDEX IF NOT EXISTS "PaintCode_code_idx" ON "PaintCode"("code");
CREATE INDEX IF NOT EXISTS "PaintCode_makeId_idx" ON "PaintCode"("makeId");
CREATE INDEX IF NOT EXISTS "PartsDiagram_vehicleModelId_idx" ON "PartsDiagram"("vehicleModelId");
CREATE INDEX IF NOT EXISTS "ServiceManual_vehicleModelId_idx" ON "ServiceManual"("vehicleModelId");
CREATE INDEX IF NOT EXISTS "LaborTimeGuide_vehicleModelId_idx" ON "LaborTimeGuide"("vehicleModelId");

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS "OEMPart_search_idx" ON "OEMPart" USING GIN (to_tsvector('english', "partName" || ' ' || COALESCE("description", '')));
CREATE INDEX IF NOT EXISTS "AftermarketPart_search_idx" ON "AftermarketPart" USING GIN (to_tsvector('english', "partName" || ' ' || COALESCE("description", '')));

-- Enable RLS
ALTER TABLE "VehicleMake" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VehicleModel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OEMPart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AftermarketPart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartsDiagram" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceManual" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PaintCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LaborTimeGuide" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartsCrossReference" ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Public read, authenticated write)
CREATE POLICY "public_read_vehicle_make" ON "VehicleMake" FOR SELECT USING (true);
CREATE POLICY "public_read_vehicle_model" ON "VehicleModel" FOR SELECT USING (true);
CREATE POLICY "public_read_oem_part" ON "OEMPart" FOR SELECT USING (true);
CREATE POLICY "public_read_aftermarket_part" ON "AftermarketPart" FOR SELECT USING (true);
CREATE POLICY "public_read_parts_diagram" ON "PartsDiagram" FOR SELECT USING (true);
CREATE POLICY "public_read_service_manual" ON "ServiceManual" FOR SELECT USING (true);
CREATE POLICY "public_read_paint_code" ON "PaintCode" FOR SELECT USING (true);
CREATE POLICY "public_read_labor_time" ON "LaborTimeGuide" FOR SELECT USING (true);
CREATE POLICY "public_read_cross_reference" ON "PartsCrossReference" FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON "VehicleMake" TO authenticated;
GRANT ALL ON "VehicleModel" TO authenticated;
GRANT ALL ON "OEMPart" TO authenticated;
GRANT ALL ON "AftermarketPart" TO authenticated;
GRANT ALL ON "PartsDiagram" TO authenticated;
GRANT ALL ON "ServiceManual" TO authenticated;
GRANT ALL ON "PaintCode" TO authenticated;
GRANT ALL ON "LaborTimeGuide" TO authenticated;
GRANT ALL ON "PartsCrossReference" TO authenticated;

GRANT SELECT ON "VehicleMake" TO anon;
GRANT SELECT ON "VehicleModel" TO anon;
GRANT SELECT ON "OEMPart" TO anon;
GRANT SELECT ON "AftermarketPart" TO anon;
GRANT SELECT ON "PartsDiagram" TO anon;
GRANT SELECT ON "ServiceManual" TO anon;
GRANT SELECT ON "PaintCode" TO anon;
GRANT SELECT ON "LaborTimeGuide" TO anon;
GRANT SELECT ON "PartsCrossReference" TO anon;

-- Comments
COMMENT ON TABLE "VehicleMake" IS 'Vehicle manufacturers (Toyota, Honda, Ford, etc.)';
COMMENT ON TABLE "VehicleModel" IS 'Specific vehicle models with year, trim, engine';
COMMENT ON TABLE "OEMPart" IS 'OEM parts catalog with pricing and compatibility';
COMMENT ON TABLE "AftermarketPart" IS 'Aftermarket parts catalog (LKQ, etc.)';
COMMENT ON TABLE "PartsDiagram" IS 'Exploded view diagrams with clickable parts';
COMMENT ON TABLE "ServiceManual" IS 'Factory service manuals and repair procedures';
COMMENT ON TABLE "PaintCode" IS 'OEM paint codes and formulas';
COMMENT ON TABLE "LaborTimeGuide" IS 'Standard labor times (Mitchell/Motor)';
COMMENT ON TABLE "PartsCrossReference" IS 'OEM to aftermarket part number cross-reference';
