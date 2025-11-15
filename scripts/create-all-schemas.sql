-- CollisionPro Complete Database Schema
-- Run this file once in Supabase SQL Editor
-- This creates all tables in the correct dependency order

-- ============================================
-- 1. PARTS SUPPLIERS
-- ============================================

CREATE TABLE IF NOT EXISTS "PartSupplier" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "code" TEXT UNIQUE NOT NULL,
  "apiEndpoint" TEXT,
  "apiKey" TEXT,
  "websiteUrl" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "averageShippingDays" INTEGER DEFAULT 3,
  "returnPolicy" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert suppliers
INSERT INTO "PartSupplier" ("id", "name", "code", "websiteUrl", "averageShippingDays") VALUES
  ('sup_lkq', 'LKQ Corporation', 'LKQ', 'https://www.lkqonline.com', 2),
  ('sup_rockauto', 'RockAuto', 'ROCKAUTO', 'https://www.rockauto.com', 3),
  ('sup_autozone', 'AutoZone', 'AUTOZONE', 'https://www.autozone.com', 1),
  ('sup_oreilly', 'O''Reilly Auto Parts', 'OREILLY', 'https://www.oreillyauto.com', 1),
  ('sup_napa', 'NAPA Auto Parts', 'NAPA', 'https://www.napaonline.com', 1),
  ('sup_partsgeek', 'PartsGeek', 'PARTSGEEK', 'https://www.partsgeek.com', 4)
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- 2. PARTS CATALOG
-- ============================================

CREATE TABLE IF NOT EXISTS "Part" (
  "id" TEXT PRIMARY KEY,
  "partNumber" TEXT NOT NULL,
  "partType" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "oemPartNumber" TEXT,
  "isOEM" BOOLEAN DEFAULT false,
  "make" TEXT,
  "model" TEXT,
  "yearStart" INTEGER,
  "yearEnd" INTEGER,
  "images" JSONB DEFAULT '[]',
  "specifications" JSONB DEFAULT '{}',
  "weight" DECIMAL(10,2),
  "dimensions" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_part_partnumber" ON "Part"("partNumber");
CREATE INDEX IF NOT EXISTS "idx_part_oempartnumber" ON "Part"("oemPartNumber");
CREATE INDEX IF NOT EXISTS "idx_part_make_model" ON "Part"("make", "model");
CREATE INDEX IF NOT EXISTS "idx_part_category" ON "Part"("category");

-- ============================================
-- 3. PART CROSS-REFERENCE
-- ============================================

CREATE TABLE IF NOT EXISTS "PartCrossReference" (
  "id" TEXT PRIMARY KEY,
  "oemPartId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "aftermarketPartId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "qualityRating" TEXT DEFAULT 'standard',
  "fitmentNotes" TEXT,
  "isDirectFit" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("oemPartId", "aftermarketPartId")
);

CREATE INDEX IF NOT EXISTS "idx_crossref_oem" ON "PartCrossReference"("oemPartId");
CREATE INDEX IF NOT EXISTS "idx_crossref_aftermarket" ON "PartCrossReference"("aftermarketPartId");

-- ============================================
-- 4. PART PRICING
-- ============================================

CREATE TABLE IF NOT EXISTS "PartPrice" (
  "id" TEXT PRIMARY KEY,
  "partId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,
  "supplierPartNumber" TEXT,
  "price" DECIMAL(10,2) NOT NULL,
  "listPrice" DECIMAL(10,2),
  "currency" TEXT DEFAULT 'USD',
  "inStock" BOOLEAN DEFAULT true,
  "quantity" INTEGER,
  "leadTimeDays" INTEGER,
  "condition" TEXT DEFAULT 'new',
  "warranty" TEXT,
  "lastUpdated" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "productUrl" TEXT,
  UNIQUE("partId", "supplierId")
);

CREATE INDEX IF NOT EXISTS "idx_partprice_part" ON "PartPrice"("partId");
CREATE INDEX IF NOT EXISTS "idx_partprice_supplier" ON "PartPrice"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_partprice_price" ON "PartPrice"("price");

-- ============================================
-- 5. ESTIMATE PARTS (only if Estimate table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Estimate') THEN
    CREATE TABLE IF NOT EXISTS "EstimatePart" (
      "id" TEXT PRIMARY KEY,
      "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
      "partId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
      "partPriceId" TEXT REFERENCES "PartPrice"("id") ON DELETE SET NULL,
      "quantity" INTEGER NOT NULL DEFAULT 1,
      "unitPrice" DECIMAL(10,2) NOT NULL,
      "totalPrice" DECIMAL(10,2) NOT NULL,
      "markup" DECIMAL(5,2) DEFAULT 0,
      "notes" TEXT,
      "position" INTEGER,
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS "idx_estimatepart_estimate" ON "EstimatePart"("estimateId");
  END IF;
END $$;

-- ============================================
-- 6. PURCHASE ORDERS
-- ============================================

CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,

  "estimateId" TEXT,
  "customerName" TEXT,
  "vehicleMake" TEXT,
  "vehicleModel" TEXT,
  "vehicleYear" INTEGER,
  "vehicleVin" TEXT,

  "status" TEXT NOT NULL DEFAULT 'pending',
  "orderDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDeliveryDate" TIMESTAMP,
  "actualDeliveryDate" TIMESTAMP,

  "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL DEFAULT 0,

  "supplierOrderNumber" TEXT,
  "supplierOrderUrl" TEXT,
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,

  "notes" TEXT,
  "attachments" JSONB DEFAULT '[]',

  "createdBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_po_shop" ON "PurchaseOrder"("shopId");
CREATE INDEX IF NOT EXISTS "idx_po_supplier" ON "PurchaseOrder"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_po_status" ON "PurchaseOrder"("status");
CREATE INDEX IF NOT EXISTS "idx_po_order_date" ON "PurchaseOrder"("orderDate" DESC);
CREATE INDEX IF NOT EXISTS "idx_po_vehicle" ON "PurchaseOrder"("vehicleMake", "vehicleModel", "vehicleYear");

-- ============================================
-- 7. ORDER ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
  "partId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "partPriceId" TEXT REFERENCES "PartPrice"("id") ON DELETE SET NULL,

  "partNumber" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL,

  "productUrl" TEXT,

  "quantityReceived" INTEGER DEFAULT 0,
  "receivedDate" TIMESTAMP,
  "condition" TEXT,

  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_orderitem_po" ON "OrderItem"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "idx_orderitem_part" ON "OrderItem"("partId");

-- ============================================
-- 8. ORDER STATUS HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
  "id" TEXT PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "changedBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_orderstatus_po" ON "OrderStatusHistory"("purchaseOrderId");

-- ============================================
-- 9. SCRAPER LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS "ScrapeLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,
  "supplierName" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "partsScraped" INTEGER NOT NULL DEFAULT 0,
  "partsAdded" INTEGER NOT NULL DEFAULT 0,
  "partsUpdated" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB DEFAULT '[]',
  "duration" INTEGER NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ScrapeLog_supplierId_idx" ON "ScrapeLog"("supplierId");
CREATE INDEX IF NOT EXISTS "ScrapeLog_timestamp_idx" ON "ScrapeLog"("timestamp" DESC);

-- ============================================
-- 10. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update PurchaseOrder totals
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "PurchaseOrder"
  SET
    "subtotal" = (
      SELECT COALESCE(SUM("totalPrice"), 0)
      FROM "OrderItem"
      WHERE "purchaseOrderId" = COALESCE(NEW."purchaseOrderId", OLD."purchaseOrderId")
    ),
    "total" = (
      SELECT COALESCE(SUM("totalPrice"), 0)
      FROM "OrderItem"
      WHERE "purchaseOrderId" = COALESCE(NEW."purchaseOrderId", OLD."purchaseOrderId")
    ) + COALESCE("tax", 0) + COALESCE("shipping", 0),
    "updatedAt" = NOW()
  WHERE "id" = COALESCE(NEW."purchaseOrderId", OLD."purchaseOrderId");

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_po_total ON "OrderItem";
CREATE TRIGGER trigger_update_po_total
AFTER INSERT OR UPDATE OR DELETE ON "OrderItem"
FOR EACH ROW
EXECUTE FUNCTION update_purchase_order_total();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_date TEXT;
  order_count INTEGER;
  order_number TEXT;
BEGIN
  order_date := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COUNT(*) + 1 INTO order_count
  FROM "PurchaseOrder"
  WHERE "orderNumber" LIKE 'PO-' || order_date || '-%';

  order_number := 'PO-' || order_date || '-' || LPAD(order_count::TEXT, 3, '0');

  RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. SAMPLE DATA
-- ============================================

-- Sample parts (Honda Civic bumper)
INSERT INTO "Part" ("id", "partNumber", "partType", "category", "name", "description", "oemPartNumber", "isOEM", "make", "model", "yearStart", "yearEnd", "weight") VALUES
  ('part_oem_civic_bumper', '04711-TBA-A90ZZ', 'BODY_PANEL', 'Bumper Cover', 'Honda Civic Front Bumper Cover (OEM)', 'Factory original front bumper cover for 2020-2024 Honda Civic', '04711-TBA-A90ZZ', true, 'Honda', 'Civic', 2020, 2024, 12.5),
  ('part_aft_civic_bumper_1', 'HO1000311', 'BODY_PANEL', 'Bumper Cover', 'Civic Front Bumper (Premium Aftermarket)', 'CAPA certified aftermarket front bumper cover', '04711-TBA-A90ZZ', false, 'Honda', 'Civic', 2020, 2024, 12.0),
  ('part_aft_civic_bumper_2', 'AC1000171', 'BODY_PANEL', 'Bumper Cover', 'Civic Front Bumper (Standard Aftermarket)', 'Quality aftermarket front bumper cover', '04711-TBA-A90ZZ', false, 'Honda', 'Civic', 2020, 2024, 11.5)
ON CONFLICT ("id") DO NOTHING;

-- Cross-references
INSERT INTO "PartCrossReference" ("id", "oemPartId", "aftermarketPartId", "qualityRating", "isDirectFit") VALUES
  ('xref_1', 'part_oem_civic_bumper', 'part_aft_civic_bumper_1', 'premium', true),
  ('xref_2', 'part_oem_civic_bumper', 'part_aft_civic_bumper_2', 'standard', true)
ON CONFLICT ("id") DO NOTHING;

-- Sample pricing
INSERT INTO "PartPrice" ("id", "partId", "supplierId", "supplierPartNumber", "price", "listPrice", "inStock", "leadTimeDays", "warranty", "productUrl") VALUES
  -- OEM pricing
  ('price_1', 'part_oem_civic_bumper', 'sup_autozone', '04711-TBA-A90ZZ', 589.99, 650.00, true, 1, '1 Year', 'https://www.autozone.com/collision-body-parts-and-hardware/bumper-cover/p/duraflex-front-bumper-cover-104771/12345'),
  ('price_2', 'part_oem_civic_bumper', 'sup_oreilly', '04711-TBA-A90ZZ', 599.99, 650.00, true, 1, '1 Year', 'https://www.oreillyauto.com/detail/b/duraflex-6789/body---trim-16547/bumpers-16621/12345'),
  ('price_3', 'part_oem_civic_bumper', 'sup_napa', '04711-TBA-A90ZZ', 609.99, 650.00, false, 3, '1 Year', 'https://www.napaonline.com/en/p/BK_12345'),

  -- Premium aftermarket pricing
  ('price_4', 'part_aft_civic_bumper_1', 'sup_lkq', 'HO1000311', 299.99, 450.00, true, 2, 'Lifetime', 'https://www.lkqonline.com/HO1000311-Front-Bumper-Cover/12345'),
  ('price_5', 'part_aft_civic_bumper_1', 'sup_rockauto', 'HO1000311', 289.99, 450.00, true, 3, 'Lifetime', 'https://www.rockauto.com/en/catalog/honda,2020,civic,1.5l+l4+turbocharged/12345'),
  ('price_6', 'part_aft_civic_bumper_1', 'sup_partsgeek', 'HO1000311', 309.99, 450.00, true, 4, '1 Year', 'https://www.partsgeek.com/catalog/2020/honda/civic/bumper_cover/12345.html'),

  -- Standard aftermarket pricing
  ('price_7', 'part_aft_civic_bumper_2', 'sup_rockauto', 'AC1000171', 179.99, 350.00, true, 3, '90 Days', 'https://www.rockauto.com/en/catalog/honda,2020,civic,1.5l+l4+turbocharged/67890'),
  ('price_8', 'part_aft_civic_bumper_2', 'sup_partsgeek', 'AC1000171', 189.99, 350.00, true, 4, '90 Days', 'https://www.partsgeek.com/catalog/2020/honda/civic/bumper_cover/67890.html'),
  ('price_9', 'part_aft_civic_bumper_2', 'sup_lkq', 'AC1000171', 199.99, 350.00, false, 5, '90 Days', 'https://www.lkqonline.com/AC1000171-Front-Bumper-Cover/67890')
ON CONFLICT ("id") DO NOTHING;

-- ============================================
-- COMPLETE!
-- ============================================

-- Verify tables created
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'PartSupplier', 'Part', 'PartCrossReference', 'PartPrice',
    'PurchaseOrder', 'OrderItem', 'OrderStatusHistory', 'ScrapeLog'
  )
ORDER BY tablename;
