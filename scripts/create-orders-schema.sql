-- Purchase Orders & CRM Schema
-- Track what parts were bought from which suppliers for which jobs

-- Purchase Orders (one order per supplier)
CREATE TABLE "PurchaseOrder" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT UNIQUE NOT NULL, -- PO-20250114-001
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,

  -- Job/Vehicle association
  "estimateId" TEXT REFERENCES "Estimate"("id") ON DELETE SET NULL,
  "customerName" TEXT,
  "vehicleMake" TEXT,
  "vehicleModel" TEXT,
  "vehicleYear" INTEGER,
  "vehicleVin" TEXT,

  -- Order details
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, ordered, shipped, delivered, cancelled
  "orderDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expectedDeliveryDate" TIMESTAMP,
  "actualDeliveryDate" TIMESTAMP,

  -- Pricing
  "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "shipping" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total" DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Supplier info
  "supplierOrderNumber" TEXT, -- Their internal order #
  "supplierOrderUrl" TEXT, -- Direct link to order on supplier site
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,

  -- Notes & attachments
  "notes" TEXT,
  "attachments" JSONB DEFAULT '[]', -- Invoice PDFs, etc.

  -- Audit
  "createdBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Order Line Items (parts in the order)
CREATE TABLE "OrderItem" (
  "id" TEXT PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
  "partId" TEXT NOT NULL REFERENCES "Part"("id") ON DELETE CASCADE,
  "partPriceId" TEXT REFERENCES "PartPrice"("id") ON DELETE SET NULL,

  -- Item details
  "partNumber" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL,

  -- Supplier direct link
  "productUrl" TEXT, -- Direct buy link

  -- Receipt tracking
  "quantityReceived" INTEGER DEFAULT 0,
  "receivedDate" TIMESTAMP,
  "condition" TEXT, -- as-expected, damaged, wrong-part

  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Order Status History (audit trail)
CREATE TABLE "OrderStatusHistory" (
  "id" TEXT PRIMARY KEY,
  "purchaseOrderId" TEXT NOT NULL REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "changedBy" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX "idx_po_shop" ON "PurchaseOrder"("shopId");
CREATE INDEX "idx_po_supplier" ON "PurchaseOrder"("supplierId");
CREATE INDEX "idx_po_estimate" ON "PurchaseOrder"("estimateId");
CREATE INDEX "idx_po_status" ON "PurchaseOrder"("status");
CREATE INDEX "idx_po_order_date" ON "PurchaseOrder"("orderDate" DESC);
CREATE INDEX "idx_po_vehicle" ON "PurchaseOrder"("vehicleMake", "vehicleModel", "vehicleYear");
CREATE INDEX "idx_orderitem_po" ON "OrderItem"("purchaseOrderId");
CREATE INDEX "idx_orderitem_part" ON "OrderItem"("partId");
CREATE INDEX "idx_orderstatus_po" ON "OrderStatusHistory"("purchaseOrderId");

-- Trigger to update PurchaseOrder total when items change
CREATE OR REPLACE FUNCTION update_purchase_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "PurchaseOrder"
  SET
    "subtotal" = (
      SELECT COALESCE(SUM("totalPrice"), 0)
      FROM "OrderItem"
      WHERE "purchaseOrderId" = NEW."purchaseOrderId"
    ),
    "total" = (
      SELECT COALESCE(SUM("totalPrice"), 0)
      FROM "OrderItem"
      WHERE "purchaseOrderId" = NEW."purchaseOrderId"
    ) + COALESCE("tax", 0) + COALESCE("shipping", 0),
    "updatedAt" = NOW()
  WHERE "id" = NEW."purchaseOrderId";

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

COMMENT ON TABLE "PurchaseOrder" IS 'Purchase orders for parts from suppliers';
COMMENT ON TABLE "OrderItem" IS 'Line items (parts) in purchase orders';
COMMENT ON TABLE "OrderStatusHistory" IS 'Audit trail of order status changes';
