/**
 * Phase 8.2: Advanced Parts Management System
 *
 * Multi-supplier catalog, smart recommendations, pricing automation,
 * inventory tracking, and bulk ordering
 */

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE part_condition AS ENUM ('new', 'oem', 'aftermarket', 'used', 'refurbished', 'remanufactured');
CREATE TYPE part_quality_grade AS ENUM ('premium', 'standard', 'economy', 'budget');
CREATE TYPE part_availability_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'backorder', 'discontinued', 'special_order');
CREATE TYPE pricing_update_frequency AS ENUM ('real_time', 'hourly', 'daily', 'weekly', 'manual');

-- ============================================================================
-- PART CATALOG
-- ============================================================================

-- Enhanced Part Catalog
CREATE TABLE IF NOT EXISTS "PartCatalog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "partNumber" TEXT NOT NULL,
  "supplierPartNumber" TEXT,
  "supplierId" TEXT REFERENCES "Supplier"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- 'body', 'mechanical', 'electrical', 'interior', etc.
  "subcategory" TEXT,
  "manufacturer" TEXT,
  "brand" TEXT,
  "condition" part_condition DEFAULT 'new',
  "qualityGrade" part_quality_grade DEFAULT 'standard',

  -- Fitment Information
  "make" TEXT,
  "model" TEXT,
  "year" INTEGER,
  "yearStart" INTEGER,
  "yearEnd" INTEGER,
  "fitmentNotes" TEXT,
  "universalFit" BOOLEAN DEFAULT false,
  "compatibleVehicles" JSONB DEFAULT '[]'::jsonb, -- Array of VIN patterns or vehicle IDs

  -- Specifications
  "specifications" JSONB DEFAULT '{}'::jsonb,
  "dimensions" JSONB DEFAULT '{}'::jsonb, -- {length, width, height, weight}
  "color" TEXT,
  "finish" TEXT,

  -- Pricing
  "cost" DECIMAL(10, 2),
  "msrp" DECIMAL(10, 2),
  "price" DECIMAL(10, 2) NOT NULL,
  "coreCharge" DECIMAL(10, 2) DEFAULT 0,
  "shippingCost" DECIMAL(10, 2) DEFAULT 0,
  "taxable" BOOLEAN DEFAULT true,

  -- Inventory
  "sku" TEXT,
  "upc" TEXT,
  "quantityAvailable" INTEGER DEFAULT 0,
  "availabilityStatus" part_availability_status DEFAULT 'in_stock',
  "leadTimeDays" INTEGER DEFAULT 0,
  "minimumOrderQuantity" INTEGER DEFAULT 1,
  "quantityPerPackage" INTEGER DEFAULT 1,

  -- Images & Documentation
  "imageUrl" TEXT,
  "images" JSONB DEFAULT '[]'::jsonb, -- Array of image URLs
  "datasheetUrl" TEXT,
  "installationGuide" TEXT,

  -- Quality & Warranty
  "warrantyMonths" INTEGER DEFAULT 12,
  "warrantyType" TEXT, -- 'limited', 'lifetime', 'none'
  "certifications" JSONB DEFAULT '[]'::jsonb, -- ['OEM', 'CAPA', 'NSF']
  "qualityRating" DECIMAL(3, 2) DEFAULT 0, -- 0-5 stars
  "reviewCount" INTEGER DEFAULT 0,

  -- Supplier Integration
  "supplierUrl" TEXT,
  "lastPriceUpdate" TIMESTAMP,
  "pricingUpdateFrequency" pricing_update_frequency DEFAULT 'daily',
  "autoUpdatePricing" BOOLEAN DEFAULT false,

  -- Search & Categorization
  "keywords" TEXT[],
  "tags" TEXT[],
  "isActive" BOOLEAN DEFAULT true,
  "isFeatured" BOOLEAN DEFAULT false,
  "isPopular" BOOLEAN DEFAULT false,

  -- Metadata
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("partNumber", "supplierId")
);

-- Indexes for PartCatalog
CREATE INDEX IF NOT EXISTS "idx_part_catalog_supplier" ON "PartCatalog"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_part_catalog_category" ON "PartCatalog"("category", "subcategory");
CREATE INDEX IF NOT EXISTS "idx_part_catalog_fitment" ON "PartCatalog"("make", "model", "year");
CREATE INDEX IF NOT EXISTS "idx_part_catalog_availability" ON "PartCatalog"("availabilityStatus");
CREATE INDEX IF NOT EXISTS "idx_part_catalog_search" ON "PartCatalog" USING GIN("keywords");
CREATE INDEX IF NOT EXISTS "idx_part_catalog_active" ON "PartCatalog"("isActive") WHERE "isActive" = true;
CREATE INDEX IF NOT EXISTS "idx_part_catalog_part_number" ON "PartCatalog"("partNumber");

-- ============================================================================
-- PARTS RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PartRecommendation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "partCatalogId" TEXT REFERENCES "PartCatalog"("id") ON DELETE CASCADE,

  -- Recommendation Context
  "damageType" TEXT, -- 'front_collision', 'side_impact', etc.
  "vehicleMake" TEXT,
  "vehicleModel" TEXT,
  "vehicleYear" INTEGER,

  -- Recommendation Score
  "score" DECIMAL(5, 4) DEFAULT 0, -- 0-1 confidence score
  "fitmentScore" DECIMAL(5, 4) DEFAULT 0,
  "priceScore" DECIMAL(5, 4) DEFAULT 0,
  "qualityScore" DECIMAL(5, 4) DEFAULT 0,
  "availabilityScore" DECIMAL(5, 4) DEFAULT 0,

  -- Reasoning
  "reasons" JSONB DEFAULT '[]'::jsonb, -- ['exact_match', 'popular_choice', 'best_price']
  "alternatives" JSONB DEFAULT '[]'::jsonb, -- Array of alternative part IDs

  -- User Feedback
  "selected" BOOLEAN DEFAULT false,
  "rejected" BOOLEAN DEFAULT false,
  "userFeedback" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_part_recommendation_estimate" ON "PartRecommendation"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_part_recommendation_part" ON "PartRecommendation"("partCatalogId");
CREATE INDEX IF NOT EXISTS "idx_part_recommendation_score" ON "PartRecommendation"("score" DESC);

-- ============================================================================
-- PRICING HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PartPricingHistory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "partCatalogId" TEXT REFERENCES "PartCatalog"("id") ON DELETE CASCADE,
  "price" DECIMAL(10, 2) NOT NULL,
  "cost" DECIMAL(10, 2),
  "msrp" DECIMAL(10, 2),
  "availabilityStatus" part_availability_status,
  "quantityAvailable" INTEGER,
  "source" TEXT, -- 'manual', 'api', 'scraper'
  "recordedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_pricing_history_part" ON "PartPricingHistory"("partCatalogId", "recordedAt" DESC);

-- ============================================================================
-- INVENTORY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ShopInventory" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "partCatalogId" TEXT REFERENCES "PartCatalog"("id") ON DELETE CASCADE,

  -- Inventory Tracking
  "quantityOnHand" INTEGER DEFAULT 0,
  "quantityReserved" INTEGER DEFAULT 0, -- Reserved for estimates
  "quantityAvailable" INTEGER GENERATED ALWAYS AS ("quantityOnHand" - "quantityReserved") STORED,

  -- Reorder Management
  "reorderPoint" INTEGER DEFAULT 5,
  "reorderQuantity" INTEGER DEFAULT 10,
  "minimumStock" INTEGER DEFAULT 2,
  "maximumStock" INTEGER DEFAULT 50,

  -- Location
  "binLocation" TEXT, -- 'A-12-3' (Aisle-Shelf-Bin)
  "warehouse" TEXT,

  -- Costing
  "averageCost" DECIMAL(10, 2),
  "lastCost" DECIMAL(10, 2),
  "totalValue" DECIMAL(10, 2) GENERATED ALWAYS AS ("quantityOnHand" * "averageCost") STORED,

  -- Usage Stats
  "monthlyUsage" INTEGER DEFAULT 0,
  "lastUsedDate" TIMESTAMP,
  "lastRestockedDate" TIMESTAMP,

  -- Status
  "isActive" BOOLEAN DEFAULT true,
  "notes" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "partCatalogId")
);

CREATE INDEX IF NOT EXISTS "idx_shop_inventory_shop" ON "ShopInventory"("shopId");
CREATE INDEX IF NOT EXISTS "idx_shop_inventory_part" ON "ShopInventory"("partCatalogId");
CREATE INDEX IF NOT EXISTS "idx_shop_inventory_reorder" ON "ShopInventory"("quantityAvailable")
  WHERE "quantityAvailable" <= "reorderPoint";

-- ============================================================================
-- INVENTORY TRANSACTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "InventoryTransaction" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopInventoryId" TEXT REFERENCES "ShopInventory"("id") ON DELETE CASCADE,
  "partCatalogId" TEXT REFERENCES "PartCatalog"("id") ON DELETE CASCADE,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Transaction Details
  "type" TEXT NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return', 'reserve', 'release'
  "quantity" INTEGER NOT NULL,
  "unitCost" DECIMAL(10, 2),
  "totalCost" DECIMAL(10, 2),

  -- References
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,
  "partsOrderId" TEXT,
  "invoiceNumber" TEXT,

  -- Details
  "reason" TEXT,
  "notes" TEXT,
  "performedBy" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_inventory_transaction_inventory" ON "InventoryTransaction"("shopInventoryId");
CREATE INDEX IF NOT EXISTS "idx_inventory_transaction_shop" ON "InventoryTransaction"("shopId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_inventory_transaction_type" ON "InventoryTransaction"("type");

-- ============================================================================
-- BULK ORDERS & OPTIMIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS "BulkOrderTemplate" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "description" TEXT,

  -- Scheduling
  "frequency" TEXT, -- 'weekly', 'monthly', 'quarterly'
  "dayOfWeek" INTEGER, -- 0-6 for weekly
  "dayOfMonth" INTEGER, -- 1-31 for monthly
  "isActive" BOOLEAN DEFAULT true,
  "lastRunDate" TIMESTAMP,
  "nextRunDate" TIMESTAMP,

  -- Parts Selection Criteria
  "includeLowStock" BOOLEAN DEFAULT true,
  "includePopularParts" BOOLEAN DEFAULT true,
  "minimumQuantity" INTEGER DEFAULT 1,
  "budgetLimit" DECIMAL(10, 2),

  -- Supplier Preferences
  "preferredSuppliers" JSONB DEFAULT '[]'::jsonb, -- Array of supplier IDs
  "excludedSuppliers" JSONB DEFAULT '[]'::jsonb,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_bulk_order_template_shop" ON "BulkOrderTemplate"("shopId");

-- ============================================================================
-- PARTS ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PartAnalytics" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "partCatalogId" TEXT REFERENCES "PartCatalog"("id") ON DELETE CASCADE,
  "shopId" TEXT REFERENCES "Shop"("id") ON DELETE CASCADE,
  "date" DATE NOT NULL,

  -- Usage Metrics
  "timesRecommended" INTEGER DEFAULT 0,
  "timesSelected" INTEGER DEFAULT 0,
  "timesOrdered" INTEGER DEFAULT 0,
  "quantityOrdered" INTEGER DEFAULT 0,

  -- Financial Metrics
  "totalRevenue" DECIMAL(10, 2) DEFAULT 0,
  "totalCost" DECIMAL(10, 2) DEFAULT 0,
  "totalProfit" DECIMAL(10, 2) DEFAULT 0,
  "averageMargin" DECIMAL(5, 4) DEFAULT 0,

  -- Performance Metrics
  "averageLeadTime" DECIMAL(5, 2) DEFAULT 0, -- Days
  "fulfillmentRate" DECIMAL(5, 4) DEFAULT 0, -- 0-1
  "returnRate" DECIMAL(5, 4) DEFAULT 0,

  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("partCatalogId", "shopId", "date")
);

CREATE INDEX IF NOT EXISTS "idx_part_analytics_part_date" ON "PartAnalytics"("partCatalogId", "date" DESC);
CREATE INDEX IF NOT EXISTS "idx_part_analytics_shop_date" ON "PartAnalytics"("shopId", "date" DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_part_catalog_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_part_catalog_timestamp
  BEFORE UPDATE ON "PartCatalog"
  FOR EACH ROW
  EXECUTE FUNCTION update_part_catalog_timestamp();

CREATE TRIGGER trigger_update_shop_inventory_timestamp
  BEFORE UPDATE ON "ShopInventory"
  FOR EACH ROW
  EXECUTE FUNCTION update_part_catalog_timestamp();

-- Track inventory transactions
CREATE OR REPLACE FUNCTION update_shop_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.type IN ('purchase', 'adjustment') AND NEW.quantity > 0 THEN
    UPDATE "ShopInventory"
    SET "quantityOnHand" = "quantityOnHand" + NEW.quantity,
        "lastRestockedDate" = NOW(),
        "updatedAt" = NOW()
    WHERE "id" = NEW."shopInventoryId";

  ELSIF NEW.type IN ('sale', 'adjustment') AND NEW.quantity < 0 THEN
    UPDATE "ShopInventory"
    SET "quantityOnHand" = "quantityOnHand" + NEW.quantity, -- quantity is negative
        "lastUsedDate" = NOW(),
        "updatedAt" = NOW()
    WHERE "id" = NEW."shopInventoryId";

  ELSIF NEW.type = 'reserve' THEN
    UPDATE "ShopInventory"
    SET "quantityReserved" = "quantityReserved" + NEW.quantity,
        "updatedAt" = NOW()
    WHERE "id" = NEW."shopInventoryId";

  ELSIF NEW.type = 'release' THEN
    UPDATE "ShopInventory"
    SET "quantityReserved" = "quantityReserved" - NEW.quantity,
        "updatedAt" = NOW()
    WHERE "id" = NEW."shopInventoryId";
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shop_inventory_on_transaction
  AFTER INSERT ON "InventoryTransaction"
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_inventory_on_transaction();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Get low stock items for a shop
CREATE OR REPLACE FUNCTION get_low_stock_items(p_shop_id TEXT)
RETURNS TABLE (
  part_id TEXT,
  part_name TEXT,
  quantity_available INTEGER,
  reorder_point INTEGER,
  reorder_quantity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc."id",
    pc."name",
    si."quantityAvailable",
    si."reorderPoint",
    si."reorderQuantity"
  FROM "ShopInventory" si
  JOIN "PartCatalog" pc ON pc."id" = si."partCatalogId"
  WHERE si."shopId" = p_shop_id
    AND si."quantityAvailable" <= si."reorderPoint"
    AND si."isActive" = true
  ORDER BY (si."reorderPoint" - si."quantityAvailable") DESC;
END;
$$ LANGUAGE plpgsql;

-- Get part recommendations for estimate
CREATE OR REPLACE FUNCTION get_part_recommendations(
  p_estimate_id TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  part_id TEXT,
  part_name TEXT,
  price DECIMAL,
  score DECIMAL,
  reasons JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc."id",
    pc."name",
    pc."price",
    pr."score",
    pr."reasons"
  FROM "PartRecommendation" pr
  JOIN "PartCatalog" pc ON pc."id" = pr."partCatalogId"
  WHERE pr."estimateId" = p_estimate_id
    AND pc."isActive" = true
    AND pc."availabilityStatus" IN ('in_stock', 'low_stock')
  ORDER BY pr."score" DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

COMMENT ON TABLE "PartCatalog" IS 'Enhanced parts catalog with multi-supplier support, fitment data, and pricing automation';
COMMENT ON TABLE "PartRecommendation" IS 'AI-powered part recommendations based on damage analysis and vehicle fitment';
COMMENT ON TABLE "ShopInventory" IS 'Shop-level inventory tracking with automated reorder points';
COMMENT ON TABLE "InventoryTransaction" IS 'Audit trail for all inventory movements';
COMMENT ON TABLE "PartAnalytics" IS 'Daily analytics for parts performance and profitability';
