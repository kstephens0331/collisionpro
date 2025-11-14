-- CollisionPro Parts Integration Schema
-- Multi-supplier parts catalog with cross-reference and pricing

-- Parts Suppliers (LKQ, RockAuto, AutoZone, O'Reilly, NAPA, PartsGeek, etc.)
CREATE TABLE "PartSupplier" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT UNIQUE NOT NULL, -- LKQ, ROCKAUTO, AUTOZONE, etc.
  "apiEndpoint" TEXT,
  "apiKey" TEXT,
  "websiteUrl" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "averageShippingDays" INTEGER DEFAULT 3,
  "returnPolicy" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Universal Parts Catalog
CREATE TABLE "Part" (
  "id" TEXT PRIMARY KEY,
  "partNumber" TEXT NOT NULL, -- OEM or universal part number
  "partType" TEXT NOT NULL, -- BODY_PANEL, ENGINE, BRAKE, SUSPENSION, etc.
  "category" TEXT NOT NULL, -- Hood, Fender, Bumper, Headlight, etc.
  "name" TEXT NOT NULL,
  "description" TEXT,
  "oemPartNumber" TEXT, -- Original OEM number if this is aftermarket
  "isOEM" BOOLEAN DEFAULT false,
  "make" TEXT, -- Ford, Toyota, Honda, etc.
  "model" TEXT, -- F-150, Camry, Civic, etc.
  "yearStart" INTEGER,
  "yearEnd" INTEGER,
  "images" JSONB DEFAULT '[]', -- Array of image URLs
  "specifications" JSONB DEFAULT '{}', -- Technical specs
  "weight" DECIMAL(10,2), -- in pounds
  "dimensions" JSONB, -- {length, width, height} in inches
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Part Cross-Reference (OEM to Aftermarket compatibility)
CREATE TABLE "PartCrossReference" (
  "id" TEXT PRIMARY KEY,
  "oemPartId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "aftermarketPartId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "qualityRating" TEXT DEFAULT 'standard', -- economy, standard, premium, oem
  "fitmentNotes" TEXT,
  "isDirectFit" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("oemPartId", "aftermarketPartId")
);

-- Real-time pricing from each supplier
CREATE TABLE "PartPrice" (
  "id" TEXT PRIMARY KEY,
  "partId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,
  "supplierPartNumber" TEXT, -- Supplier's internal part number
  "price" DECIMAL(10,2) NOT NULL,
  "listPrice" DECIMAL(10,2), -- MSRP for discount calculation
  "currency" TEXT DEFAULT 'USD',
  "inStock" BOOLEAN DEFAULT true,
  "quantity" INTEGER, -- Available quantity
  "leadTimeDays" INTEGER, -- How long to ship
  "condition" TEXT DEFAULT 'new', -- new, refurbished, used
  "warranty" TEXT, -- 90 days, 1 year, lifetime, etc.
  "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "productUrl" TEXT, -- Direct link to supplier page
  UNIQUE("partId", "supplierId")
);

-- Estimate Parts (links parts to estimates)
CREATE TABLE "EstimatePart" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "partId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "partPriceId" TEXT REFERENCES "PartPrice"("id") ON DELETE SET NULL, -- Selected supplier
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL, -- Price at time of estimate
  "totalPrice" DECIMAL(10,2) NOT NULL,
  "markup" DECIMAL(5,2) DEFAULT 0, -- Shop markup percentage
  "notes" TEXT,
  "position" INTEGER, -- Order in estimate
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX "idx_part_partnumber" ON "Part"("partNumber");
CREATE INDEX "idx_part_oempartnumber" ON "Part"("oemPartNumber");
CREATE INDEX "idx_part_make_model" ON "Part"("make", "model");
CREATE INDEX "idx_part_category" ON "Part"("category");
CREATE INDEX "idx_partprice_part" ON "PartPrice"("partId");
CREATE INDEX "idx_partprice_supplier" ON "PartPrice"("supplierId");
CREATE INDEX "idx_partprice_price" ON "PartPrice"("price");
CREATE INDEX "idx_estimatepart_estimate" ON "EstimatePart"("estimateId");
CREATE INDEX "idx_crossref_oem" ON "PartCrossReference"("oemPartId");
CREATE INDEX "idx_crossref_aftermarket" ON "PartCrossReference"("aftermarketPartId");

-- Insert default suppliers
INSERT INTO "PartSupplier" ("id", "name", "code", "websiteUrl", "averageShippingDays") VALUES
  ('sup_lkq', 'LKQ Corporation', 'LKQ', 'https://www.lkqonline.com', 2),
  ('sup_rockauto', 'RockAuto', 'ROCKAUTO', 'https://www.rockauto.com', 3),
  ('sup_autozone', 'AutoZone', 'AUTOZONE', 'https://www.autozone.com', 1),
  ('sup_oreilly', 'O''Reilly Auto Parts', 'OREILLY', 'https://www.oreillyauto.com', 1),
  ('sup_napa', 'NAPA Auto Parts', 'NAPA', 'https://www.napaonline.com', 1),
  ('sup_partsgeek', 'PartsGeek', 'PARTSGEEK', 'https://www.partsgeek.com', 4);

-- Sample parts data for demo (2020-2024 Honda Civic Front Bumper)
INSERT INTO "Part" ("id", "partNumber", "partType", "category", "name", "description", "oemPartNumber", "isOEM", "make", "model", "yearStart", "yearEnd") VALUES
  ('part_oem_civic_bumper', '04711-TBA-A90ZZ', 'BODY_PANEL', 'Bumper Cover', 'Honda Civic Front Bumper Cover (OEM)', 'Factory original front bumper cover for 2020-2024 Honda Civic', '04711-TBA-A90ZZ', true, 'Honda', 'Civic', 2020, 2024),
  ('part_aft_civic_bumper_1', 'HO1000311', 'BODY_PANEL', 'Bumper Cover', 'Civic Front Bumper (Premium Aftermarket)', 'CAPA certified aftermarket front bumper cover', '04711-TBA-A90ZZ', false, 'Honda', 'Civic', 2020, 2024),
  ('part_aft_civic_bumper_2', 'AC1000171', 'BODY_PANEL', 'Bumper Cover', 'Civic Front Bumper (Standard Aftermarket)', 'Quality aftermarket front bumper cover', '04711-TBA-A90ZZ', false, 'Honda', 'Civic', 2020, 2024);

-- Cross-reference aftermarket to OEM
INSERT INTO "PartCrossReference" ("id", "oemPartId", "aftermarketPartId", "qualityRating", "isDirectFit") VALUES
  ('xref_1', 'part_oem_civic_bumper', 'part_aft_civic_bumper_1', 'premium', true),
  ('xref_2', 'part_oem_civic_bumper', 'part_aft_civic_bumper_2', 'standard', true);

-- Sample pricing from different suppliers
INSERT INTO "PartPrice" ("id", "partId", "supplierId", "supplierPartNumber", "price", "listPrice", "inStock", "leadTimeDays", "warranty") VALUES
  -- OEM pricing
  ('price_1', 'part_oem_civic_bumper', 'sup_autozone', '04711-TBA-A90ZZ', 589.99, 650.00, true, 1, '1 Year'),
  ('price_2', 'part_oem_civic_bumper', 'sup_oreilly', '04711-TBA-A90ZZ', 599.99, 650.00, true, 1, '1 Year'),
  ('price_3', 'part_oem_civic_bumper', 'sup_napa', '04711-TBA-A90ZZ', 609.99, 650.00, false, 3, '1 Year'),

  -- Premium aftermarket pricing
  ('price_4', 'part_aft_civic_bumper_1', 'sup_lkq', 'HO1000311', 299.99, 450.00, true, 2, 'Lifetime'),
  ('price_5', 'part_aft_civic_bumper_1', 'sup_rockauto', 'HO1000311', 289.99, 450.00, true, 3, 'Lifetime'),
  ('price_6', 'part_aft_civic_bumper_1', 'sup_partsgeek', 'HO1000311', 309.99, 450.00, true, 4, '1 Year'),

  -- Standard aftermarket pricing
  ('price_7', 'part_aft_civic_bumper_2', 'sup_rockauto', 'AC1000171', 179.99, 350.00, true, 3, '90 Days'),
  ('price_8', 'part_aft_civic_bumper_2', 'sup_partsgeek', 'AC1000171', 189.99, 350.00, true, 4, '90 Days'),
  ('price_9', 'part_aft_civic_bumper_2', 'sup_lkq', 'AC1000171', 199.99, 350.00, false, 5, '90 Days');

COMMENT ON TABLE "PartSupplier" IS 'Parts suppliers and vendors (LKQ, RockAuto, etc.)';
COMMENT ON TABLE "Part" IS 'Universal parts catalog with OEM and aftermarket parts';
COMMENT ON TABLE "PartCrossReference" IS 'Cross-reference table linking OEM parts to compatible aftermarket alternatives';
COMMENT ON TABLE "PartPrice" IS 'Real-time pricing from each supplier for each part';
COMMENT ON TABLE "EstimatePart" IS 'Parts added to estimates with selected supplier and pricing';
