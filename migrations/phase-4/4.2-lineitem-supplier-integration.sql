-- Phase 4.2: Integrate Suppliers with EstimateLineItem
-- Run this in Supabase SQL Editor AFTER running 4.1-parts-suppliers.sql

-- Add supplier tracking columns to EstimateLineItem
ALTER TABLE "EstimateLineItem" ADD COLUMN IF NOT EXISTS "supplierId" TEXT REFERENCES "PartsSupplier"("id") ON DELETE SET NULL;
ALTER TABLE "EstimateLineItem" ADD COLUMN IF NOT EXISTS "supplierPartNumber" TEXT;
ALTER TABLE "EstimateLineItem" ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(10, 2);
ALTER TABLE "EstimateLineItem" ADD COLUMN IF NOT EXISTS "orderStatus" TEXT DEFAULT 'not_ordered'; -- not_ordered, ordered, received

-- Update PartsOrderItem to reference EstimateLineItem
ALTER TABLE "PartsOrderItem" ADD CONSTRAINT "fk_lineitem"
  FOREIGN KEY ("lineItemId") REFERENCES "EstimateLineItem"("id") ON DELETE SET NULL;

-- Create index for supplier lookup on line items
CREATE INDEX IF NOT EXISTS "idx_lineitem_supplier" ON "EstimateLineItem"("supplierId");
CREATE INDEX IF NOT EXISTS "idx_lineitem_order_status" ON "EstimateLineItem"("orderStatus");
