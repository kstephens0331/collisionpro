-- Phase 4.1: Parts Suppliers & Order Management
-- Run this in Supabase SQL Editor

-- Create PartsSupplier table for managing supplier accounts
CREATE TABLE IF NOT EXISTS "PartsSupplier" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- local_dealer, national, aftermarket, oem
  "accountNumber" TEXT,
  "apiKey" TEXT,
  "apiEndpoint" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "discountPercentage" DECIMAL(5, 2) DEFAULT 0,
  "defaultMarkup" DECIMAL(5, 2) DEFAULT 30,
  "deliveryDays" INTEGER DEFAULT 1,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPrimary" BOOLEAN DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create PartsOrder table for tracking orders to suppliers
CREATE TABLE IF NOT EXISTS "PartsOrder" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL REFERENCES "PartsSupplier"("id") ON DELETE CASCADE,
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,
  "orderNumber" TEXT,
  "poNumber" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, submitted, confirmed, shipped, delivered, cancelled
  "totalAmount" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "shippingCost" DECIMAL(10, 2) DEFAULT 0,
  "taxAmount" DECIMAL(10, 2) DEFAULT 0,
  "trackingNumber" TEXT,
  "expectedDelivery" DATE,
  "actualDelivery" DATE,
  "notes" TEXT,
  "submittedAt" TIMESTAMP,
  "confirmedAt" TIMESTAMP,
  "shippedAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create PartsOrderItem table for individual items in an order
CREATE TABLE IF NOT EXISTS "PartsOrderItem" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL REFERENCES "PartsOrder"("id") ON DELETE CASCADE,
  "partNumber" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitCost" DECIMAL(10, 2) NOT NULL,
  "totalCost" DECIMAL(10, 2) NOT NULL,
  "lineItemId" TEXT, -- Reference to estimate line item (if applicable)
  "coreCharge" DECIMAL(10, 2) DEFAULT 0,
  "status" TEXT DEFAULT 'ordered', -- ordered, backordered, shipped, received
  "receivedQuantity" INTEGER DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_supplier_shop" ON "PartsSupplier"("shopId");
CREATE INDEX IF NOT EXISTS "idx_supplier_type" ON "PartsSupplier"("type");
CREATE INDEX IF NOT EXISTS "idx_order_shop" ON "PartsOrder"("shopId");
CREATE INDEX IF NOT EXISTS "idx_order_supplier" ON "PartsOrder"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_order_estimate" ON "PartsOrder"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "PartsOrder"("status");
CREATE INDEX IF NOT EXISTS "idx_orderitem_order" ON "PartsOrderItem"("orderId");

-- Note: LineItem table integration will be added when that table is created
-- The PartsOrderItem.lineItemId field can be used to link to estimate line items

-- Enable RLS
ALTER TABLE "PartsSupplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartsOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartsOrderItem" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "supplier_access" ON "PartsSupplier"
  FOR ALL
  USING (true);

CREATE POLICY "order_access" ON "PartsOrder"
  FOR ALL
  USING (true);

CREATE POLICY "orderitem_access" ON "PartsOrderItem"
  FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON "PartsSupplier" TO authenticated;
GRANT ALL ON "PartsSupplier" TO service_role;
GRANT ALL ON "PartsOrder" TO authenticated;
GRANT ALL ON "PartsOrder" TO service_role;
GRANT ALL ON "PartsOrderItem" TO authenticated;
GRANT ALL ON "PartsOrderItem" TO service_role;
