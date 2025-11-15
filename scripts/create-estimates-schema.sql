-- Estimates Schema for CollisionPro
-- Phase 3: Estimating Engine

-- ============================================
-- ESTIMATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "Estimate" (
  "id" TEXT PRIMARY KEY,
  "estimateNumber" TEXT UNIQUE NOT NULL,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL DEFAULT 'draft', -- draft, sent, approved, declined, in_progress, completed

  -- Customer Information
  "customerName" TEXT NOT NULL,
  "customerEmail" TEXT,
  "customerPhone" TEXT,
  "customerAddress" TEXT,

  -- Vehicle Information
  "vehicleVin" TEXT,
  "vehicleYear" INTEGER NOT NULL,
  "vehicleMake" TEXT NOT NULL,
  "vehicleModel" TEXT NOT NULL,
  "vehicleTrim" TEXT,
  "vehicleMileage" INTEGER,
  "vehicleColor" TEXT,
  "vehicleLicensePlate" TEXT,

  -- Damage Information
  "damageDescription" TEXT,
  "dateOfLoss" TIMESTAMP,
  "insuranceCompany" TEXT,
  "claimNumber" TEXT,
  "policyNumber" TEXT,

  -- Financial Information
  "laborRate" DECIMAL(10,2) NOT NULL DEFAULT 75.00, -- Per hour
  "partsSubtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "laborSubtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "paintSubtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0.0825, -- 8.25% default
  "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "deductible" DECIMAL(10,2) DEFAULT 0,

  -- Metadata
  "notes" TEXT,
  "internalNotes" TEXT, -- Not visible to customer
  "createdBy" TEXT NOT NULL REFERENCES "User"("id"),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "sentAt" TIMESTAMP,
  "approvedAt" TIMESTAMP,
  "completedAt" TIMESTAMP
);

-- ============================================
-- ESTIMATE LINE ITEMS (Parts, Labor, Paint)
-- ============================================
CREATE TABLE IF NOT EXISTS "EstimateLineItem" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL, -- part, labor, paint, misc
  "sequence" INTEGER NOT NULL DEFAULT 0, -- Display order

  -- Part Information (if type = 'part')
  "partId" TEXT REFERENCES "Part"("id"),
  "partNumber" TEXT,
  "partName" TEXT NOT NULL,
  "partDescription" TEXT,
  "isOEM" BOOLEAN DEFAULT false,
  "supplierId" TEXT REFERENCES "PartSupplier"("id"),
  "supplierName" TEXT,

  -- Labor Information (if type = 'labor')
  "laborOperation" TEXT, -- e.g., "Remove/Install Bumper Cover"
  "laborHours" DECIMAL(5,2), -- e.g., 2.5 hours
  "laborRate" DECIMAL(10,2), -- Per hour rate

  -- Paint Information (if type = 'paint')
  "paintArea" TEXT, -- e.g., "Hood", "Front Bumper"
  "paintType" TEXT, -- e.g., "Base Coat/Clear Coat"
  "paintHours" DECIMAL(5,2),

  -- Common Fields
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "lineTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "notes" TEXT,

  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ESTIMATE PHOTOS
-- ============================================
CREATE TABLE IF NOT EXISTS "EstimatePhoto" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "mimeType" TEXT NOT NULL,
  "category" TEXT, -- damage, before, after, vin, odometer
  "caption" TEXT,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "uploadedBy" TEXT NOT NULL REFERENCES "User"("id"),
  "uploadedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ESTIMATE HISTORY / AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS "EstimateHistory" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL, -- created, updated, sent, approved, declined, etc.
  "description" TEXT,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "userName" TEXT NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  "metadata" JSONB -- Additional context
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS "idx_estimate_shop" ON "Estimate"("shopId");
CREATE INDEX IF NOT EXISTS "idx_estimate_number" ON "Estimate"("estimateNumber");
CREATE INDEX IF NOT EXISTS "idx_estimate_status" ON "Estimate"("status");
CREATE INDEX IF NOT EXISTS "idx_estimate_customer" ON "Estimate"("customerName");
CREATE INDEX IF NOT EXISTS "idx_estimate_vin" ON "Estimate"("vehicleVin");
CREATE INDEX IF NOT EXISTS "idx_estimate_created_at" ON "Estimate"("createdAt");

CREATE INDEX IF NOT EXISTS "idx_line_item_estimate" ON "EstimateLineItem"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_line_item_type" ON "EstimateLineItem"("type");
CREATE INDEX IF NOT EXISTS "idx_line_item_part" ON "EstimateLineItem"("partId");

CREATE INDEX IF NOT EXISTS "idx_photo_estimate" ON "EstimatePhoto"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_photo_category" ON "EstimatePhoto"("category");

CREATE INDEX IF NOT EXISTS "idx_history_estimate" ON "EstimateHistory"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_history_timestamp" ON "EstimateHistory"("timestamp");

-- ============================================
-- SAMPLE DATA (Development Only)
-- ============================================

-- Sample estimate
INSERT INTO "Estimate" (
  "id",
  "estimateNumber",
  "shopId",
  "customerName",
  "customerEmail",
  "customerPhone",
  "vehicleYear",
  "vehicleMake",
  "vehicleModel",
  "vehicleVin",
  "damageDescription",
  "laborRate",
  "status",
  "createdBy"
) VALUES (
  'est_sample_001',
  'EST-2025-001',
  (SELECT "id" FROM "Shop" LIMIT 1),
  'John Smith',
  'john.smith@email.com',
  '555-123-4567',
  2020,
  'Honda',
  'Civic',
  '1HGBH41JXMN109186',
  'Front-end collision. Damage to bumper, hood, headlights, and grille.',
  75.00,
  'draft',
  (SELECT "id" FROM "User" WHERE "role" = 'admin' LIMIT 1)
) ON CONFLICT ("id") DO NOTHING;

-- Sample line items
INSERT INTO "EstimateLineItem" (
  "id",
  "estimateId",
  "type",
  "sequence",
  "partName",
  "partDescription",
  "quantity",
  "unitPrice",
  "lineTotal"
) VALUES
  (
    'item_001',
    'est_sample_001',
    'part',
    1,
    'Front Bumper Cover',
    '2020 Honda Civic Front Bumper Cover - Primed',
    1,
    215.99,
    215.99
  ),
  (
    'item_002',
    'est_sample_001',
    'labor',
    2,
    'Remove/Install Bumper Cover',
    'Remove damaged bumper, install new bumper',
    1,
    187.50,
    187.50
  ),
  (
    'item_003',
    'est_sample_001',
    'part',
    3,
    'Headlight Assembly (Right)',
    '2020 Honda Civic Headlight Assembly - Passenger Side',
    1,
    289.99,
    289.99
  ),
  (
    'item_004',
    'est_sample_001',
    'labor',
    4,
    'Replace Headlight Assembly',
    'Remove damaged headlight, install new assembly',
    1,
    112.50,
    112.50
  ),
  (
    'item_005',
    'est_sample_001',
    'paint',
    5,
    'Paint Front Bumper',
    'Base coat/clear coat',
    1,
    350.00,
    350.00
  )
ON CONFLICT ("id") DO NOTHING;

-- Update estimate totals
UPDATE "Estimate"
SET
  "partsSubtotal" = 505.98,
  "laborSubtotal" = 300.00,
  "paintSubtotal" = 350.00,
  "subtotal" = 1155.98,
  "taxAmount" = 95.37,
  "total" = 1251.35
WHERE "id" = 'est_sample_001';
