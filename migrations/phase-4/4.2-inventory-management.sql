-- Phase 4.2: Inventory Management System
-- Track parts inventory, stock levels, reorder points, and receiving workflow

-- Create InventoryItem table (parts in stock)
CREATE TABLE IF NOT EXISTS "InventoryItem" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL DEFAULT 'default',
  "partNumber" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT NOT NULL, -- bumper, fender, hood, etc.
  "manufacturer" TEXT,
  "isOEM" BOOLEAN DEFAULT false,

  -- Stock tracking
  "quantityOnHand" INTEGER NOT NULL DEFAULT 0,
  "quantityReserved" INTEGER NOT NULL DEFAULT 0, -- Reserved for estimates
  "quantityAvailable" INTEGER GENERATED ALWAYS AS ("quantityOnHand" - "quantityReserved") STORED,
  "reorderPoint" INTEGER NOT NULL DEFAULT 2, -- Alert when stock falls below this
  "reorderQuantity" INTEGER NOT NULL DEFAULT 5, -- How many to order
  "minStockLevel" INTEGER NOT NULL DEFAULT 1,
  "maxStockLevel" INTEGER,

  -- Pricing
  "cost" DECIMAL(10,2) NOT NULL DEFAULT 0, -- What we paid
  "retailPrice" DECIMAL(10,2) NOT NULL DEFAULT 0, -- What we sell for
  "wholesalePrice" DECIMAL(10,2), -- Wholesale price if applicable

  -- Location & Organization
  "location" TEXT, -- Shelf/bin location (e.g., "A-12" or "Shelf 3")
  "barcode" TEXT UNIQUE, -- Barcode or QR code for scanning

  -- Supplier info
  "preferredSupplierId" TEXT,
  "supplierPartNumber" TEXT,
  "leadTimeDays" INTEGER DEFAULT 3,

  -- Vehicle fitment
  "vehicleMake" TEXT,
  "vehicleModel" TEXT,
  "vehicleYearStart" INTEGER,
  "vehicleYearEnd" INTEGER,

  -- Metadata
  "notes" TEXT,
  "lastRestocked" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create InventoryTransaction table (audit trail for all inventory changes)
CREATE TABLE IF NOT EXISTS "InventoryTransaction" (
  "id" TEXT PRIMARY KEY,
  "inventoryItemId" TEXT NOT NULL REFERENCES "InventoryItem"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL CHECK ("type" IN ('receive', 'sale', 'adjustment', 'reservation', 'return', 'damage', 'transfer')),
  "quantity" INTEGER NOT NULL, -- Positive for additions, negative for deductions
  "quantityBefore" INTEGER NOT NULL,
  "quantityAfter" INTEGER NOT NULL,

  -- Context
  "reference" TEXT, -- PO number, estimate ID, etc.
  "reason" TEXT,
  "notes" TEXT,

  -- User tracking
  "performedBy" TEXT NOT NULL DEFAULT 'System',
  "performedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create StockAlert table (automated alerts for low stock)
CREATE TABLE IF NOT EXISTS "StockAlert" (
  "id" TEXT PRIMARY KEY,
  "inventoryItemId" TEXT NOT NULL REFERENCES "InventoryItem"("id") ON DELETE CASCADE,
  "alertType" TEXT NOT NULL CHECK ("alertType" IN ('low_stock', 'out_of_stock', 'overstock')),
  "currentQuantity" INTEGER NOT NULL,
  "threshold" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'acknowledged', 'resolved')),
  "acknowledgedBy" TEXT,
  "acknowledgedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create PurchaseOrder table (for ordering stock)
CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
  "id" TEXT PRIMARY KEY,
  "poNumber" TEXT NOT NULL UNIQUE,
  "shopId" TEXT NOT NULL DEFAULT 'default',
  "supplierId" TEXT NOT NULL,
  "supplierName" TEXT NOT NULL,

  -- Status tracking
  "status" TEXT NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'sent', 'confirmed', 'partially_received', 'received', 'cancelled')),
  "orderDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expectedDeliveryDate" TIMESTAMP,
  "actualDeliveryDate" TIMESTAMP,

  -- Pricing
  "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Metadata
  "notes" TEXT,
  "createdBy" TEXT NOT NULL DEFAULT 'System',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create PurchaseOrderItem table (items in a PO)
CREATE TABLE IF NOT EXISTS "PurchaseOrderItem" (
  "id" TEXT PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
  "inventoryItemId" TEXT REFERENCES "InventoryItem"("id") ON DELETE SET NULL,

  -- Part info
  "partNumber" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  "description" TEXT,

  -- Quantities
  "quantityOrdered" INTEGER NOT NULL,
  "quantityReceived" INTEGER NOT NULL DEFAULT 0,
  "quantityRemaining" INTEGER GENERATED ALWAYS AS ("quantityOrdered" - "quantityReceived") STORED,

  -- Pricing
  "unitCost" DECIMAL(10,2) NOT NULL,
  "lineTotal" DECIMAL(10,2) GENERATED ALWAYS AS ("quantityOrdered" * "unitCost") STORED,

  -- Receiving
  "receivedDate" TIMESTAMP,
  "receivedBy" TEXT,

  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create InventoryCount table (physical inventory counts)
CREATE TABLE IF NOT EXISTS "InventoryCount" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL DEFAULT 'default',
  "countDate" TIMESTAMP NOT NULL DEFAULT NOW(),
  "countedBy" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'in_progress' CHECK ("status" IN ('in_progress', 'completed', 'cancelled')),
  "notes" TEXT,
  "totalItemsCounted" INTEGER DEFAULT 0,
  "totalDiscrepancies" INTEGER DEFAULT 0,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create InventoryCountItem table (individual counts)
CREATE TABLE IF NOT EXISTS "InventoryCountItem" (
  "id" TEXT PRIMARY KEY,
  "inventoryCountId" TEXT NOT NULL REFERENCES "InventoryCount"("id") ON DELETE CASCADE,
  "inventoryItemId" TEXT NOT NULL REFERENCES "InventoryItem"("id") ON DELETE CASCADE,
  "systemQuantity" INTEGER NOT NULL, -- What the system says
  "countedQuantity" INTEGER, -- What was physically counted
  "discrepancy" INTEGER GENERATED ALWAYS AS ("countedQuantity" - "systemQuantity") STORED,
  "notes" TEXT,
  "countedAt" TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "InventoryItem_shopId_idx" ON "InventoryItem"("shopId");
CREATE INDEX IF NOT EXISTS "InventoryItem_partNumber_idx" ON "InventoryItem"("partNumber");
CREATE INDEX IF NOT EXISTS "InventoryItem_barcode_idx" ON "InventoryItem"("barcode");
CREATE INDEX IF NOT EXISTS "InventoryItem_category_idx" ON "InventoryItem"("category");
CREATE INDEX IF NOT EXISTS "InventoryItem_quantityAvailable_idx" ON "InventoryItem"("quantityAvailable");

CREATE INDEX IF NOT EXISTS "InventoryTransaction_inventoryItemId_idx" ON "InventoryTransaction"("inventoryItemId");
CREATE INDEX IF NOT EXISTS "InventoryTransaction_type_idx" ON "InventoryTransaction"("type");
CREATE INDEX IF NOT EXISTS "InventoryTransaction_performedAt_idx" ON "InventoryTransaction"("performedAt");

CREATE INDEX IF NOT EXISTS "StockAlert_inventoryItemId_idx" ON "StockAlert"("inventoryItemId");
CREATE INDEX IF NOT EXISTS "StockAlert_status_idx" ON "StockAlert"("status");
CREATE INDEX IF NOT EXISTS "StockAlert_alertType_idx" ON "StockAlert"("alertType");

CREATE INDEX IF NOT EXISTS "PurchaseOrder_shopId_idx" ON "PurchaseOrder"("shopId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");

CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_inventoryItemId_idx" ON "PurchaseOrderItem"("inventoryItemId");

CREATE INDEX IF NOT EXISTS "InventoryCount_shopId_idx" ON "InventoryCount"("shopId");
CREATE INDEX IF NOT EXISTS "InventoryCount_status_idx" ON "InventoryCount"("status");

-- Add comments
COMMENT ON TABLE "InventoryItem" IS 'Parts inventory with stock levels and reorder points';
COMMENT ON TABLE "InventoryTransaction" IS 'Audit trail for all inventory movements';
COMMENT ON TABLE "StockAlert" IS 'Automated alerts for low stock, out of stock, etc.';
COMMENT ON TABLE "PurchaseOrder" IS 'Purchase orders for ordering inventory';
COMMENT ON TABLE "PurchaseOrderItem" IS 'Line items in purchase orders';
COMMENT ON TABLE "InventoryCount" IS 'Physical inventory count sessions';
COMMENT ON TABLE "InventoryCountItem" IS 'Individual item counts and discrepancies';

COMMENT ON COLUMN "InventoryItem"."quantityAvailable" IS 'Computed: quantityOnHand - quantityReserved';
COMMENT ON COLUMN "InventoryItem"."reorderPoint" IS 'Alert when stock falls below this level';
COMMENT ON COLUMN "InventoryItem"."barcode" IS 'Barcode or QR code for scanning';
COMMENT ON COLUMN "InventoryTransaction"."type" IS 'receive, sale, adjustment, reservation, return, damage, transfer';
COMMENT ON COLUMN "StockAlert"."alertType" IS 'low_stock, out_of_stock, overstock';
