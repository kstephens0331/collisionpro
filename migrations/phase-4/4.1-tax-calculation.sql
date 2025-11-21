-- Phase 4.1: Tax Calculation Fields
-- Add tax-related fields to Estimate table

-- Add tax calculation fields
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(10,2);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "taxRate" DECIMAL(5,4);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(10,2);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "shopSupplies" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "environmentalFees" DECIMAL(10,2) DEFAULT 0;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "grandTotal" DECIMAL(10,2);

-- Add shop tax settings
CREATE TABLE IF NOT EXISTS "ShopTaxSettings" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL,
  "taxRate" DECIMAL(5,4) NOT NULL DEFAULT 0, -- e.g., 0.0825 for 8.25%
  "taxableParts" BOOLEAN DEFAULT true,
  "taxableLabor" BOOLEAN DEFAULT false, -- Varies by state
  "shopSuppliesRate" DECIMAL(5,4) DEFAULT 0.05, -- 5% of parts/labor
  "environmentalFeeAmount" DECIMAL(10,2) DEFAULT 0,
  "state" TEXT,
  "county" TEXT,
  "city" TEXT,
  "zipCode" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("shopId")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_shop_tax_settings_shop_id" ON "ShopTaxSettings"("shopId");

-- Add comment
COMMENT ON TABLE "ShopTaxSettings" IS 'Tax configuration per shop - rates vary by location';
COMMENT ON COLUMN "ShopTaxSettings"."taxableLabor" IS 'Some states tax labor, others do not';
COMMENT ON COLUMN "ShopTaxSettings"."shopSuppliesRate" IS 'Typically 5-10% of parts/labor as supplies fee';
