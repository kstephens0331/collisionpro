-- Phase 4.3: OEM Parts Integration
-- Support for Original Equipment Manufacturer parts alongside aftermarket

-- Update AftermarketPart table to support OEM parts
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "partType" TEXT DEFAULT 'aftermarket' CHECK ("partType" IN ('oem', 'aftermarket', 'used', 'remanufactured', 'rebuilt'));
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "oemPartNumber" TEXT;
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "dealerPrice" DECIMAL(10,2);
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "listPrice" DECIMAL(10,2);
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "certifications" TEXT[]; -- CAPA, NSF, etc.
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "warranty" TEXT; -- e.g., "12 months/12,000 miles"
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "condition" TEXT CHECK ("condition" IN ('new', 'used', 'refurbished', 'rebuilt'));
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "quality" TEXT CHECK ("quality" IN ('oem', 'premium', 'standard', 'economy'));
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "fitment" TEXT; -- e.g., "Direct Fit", "Universal"
ALTER TABLE "AftermarketPart" ADD COLUMN IF NOT EXISTS "finish" TEXT; -- e.g., "Primed", "Painted", "Raw"

-- OEM Dealer Network (for dealer parts lookups)
CREATE TABLE IF NOT EXISTS "OEMDealer" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "make" TEXT NOT NULL, -- GM, Ford, Toyota, etc.
  "dealerName" TEXT NOT NULL,
  "dealerCode" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zipCode" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "partsApiEndpoint" TEXT,
  "apiKey" TEXT,
  "apiUsername" TEXT,
  "accountNumber" TEXT,
  "discountPercentage" DECIMAL(5,2) DEFAULT 0, -- Shop's negotiated discount
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oem_dealer_make ON "OEMDealer" ("make");
CREATE INDEX IF NOT EXISTS idx_oem_dealer_active ON "OEMDealer" ("isActive");

-- OEM Parts Catalog (cached OEM parts data)
CREATE TABLE IF NOT EXISTS "OEMPart" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "make" TEXT NOT NULL,
  "oemPartNumber" TEXT NOT NULL,
  "partName" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT, -- Body, Mechanical, Electrical, etc.

  -- Vehicle fitment
  "year" INT,
  "model" TEXT,
  "submodel" TEXT,

  -- Pricing
  "msrp" DECIMAL(10,2),
  "dealerCost" DECIMAL(10,2),
  "listPrice" DECIMAL(10,2),

  -- Additional info
  "weight" DECIMAL(10,2), -- lbs
  "dimensions" TEXT, -- "12x8x6"
  "supersedes" TEXT, -- Superseded part number
  "supersededBy" TEXT, -- New replacement part number
  "discontinued" BOOLEAN DEFAULT false,
  "imageUrl" TEXT,
  "diagrams" TEXT[], -- URLs to OEM diagrams

  -- Availability
  "stockStatus" TEXT, -- In Stock, Backordered, Discontinued
  "leadTime" INT, -- days

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("make", "oemPartNumber")
);

CREATE INDEX IF NOT EXISTS idx_oem_part_number ON "OEMPart" ("oemPartNumber");
CREATE INDEX IF NOT EXISTS idx_oem_part_make ON "OEMPart" ("make");
CREATE INDEX IF NOT EXISTS idx_oem_part_vehicle ON "OEMPart" ("year", "make", "model");

-- Parts comparison preferences per shop
CREATE TABLE IF NOT EXISTS "ShopPartsPreferences" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL,

  -- Default preferences
  "preferOEM" BOOLEAN DEFAULT false,
  "allowAftermarket" BOOLEAN DEFAULT true,
  "allowUsed" BOOLEAN DEFAULT false,
  "allowRebuilt" BOOLEAN DEFAULT true,

  -- Quality preferences
  "minimumQuality" TEXT DEFAULT 'standard' CHECK ("minimumQuality" IN ('oem', 'premium', 'standard', 'economy')),
  "requireCertified" BOOLEAN DEFAULT false, -- Require CAPA or NSF certification

  -- Warranty requirements
  "minimumWarrantyMonths" INT DEFAULT 12,

  -- Markup percentages by part type
  "oemMarkup" DECIMAL(5,2) DEFAULT 20, -- 20% markup on OEM
  "aftermarketMarkup" DECIMAL(5,2) DEFAULT 30, -- 30% markup on aftermarket
  "usedMarkup" DECIMAL(5,2) DEFAULT 40, -- 40% markup on used

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_shop FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE,
  UNIQUE("shopId")
);

-- Part quality certifications
CREATE TABLE IF NOT EXISTS "PartCertification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "certificationName" TEXT NOT NULL UNIQUE, -- CAPA, NSF, ISO, etc.
  "description" TEXT,
  "issuingOrganization" TEXT,
  "logoUrl" TEXT,
  "website" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Seed common certifications
INSERT INTO "PartCertification" ("certificationName", "description", "issuingOrganization", "website")
VALUES
  ('CAPA', 'Certified Automotive Parts Association - ensures aftermarket parts meet OEM quality standards', 'CAPA', 'https://capacertified.org'),
  ('NSF', 'NSF International certification for automotive parts', 'NSF International', 'https://www.nsf.org'),
  ('ISO 9001', 'International quality management standard', 'ISO', 'https://www.iso.org'),
  ('SAE', 'Society of Automotive Engineers standards', 'SAE International', 'https://www.sae.org')
ON CONFLICT ("certificationName") DO NOTHING;

-- Comments
COMMENT ON TABLE "OEMDealer" IS 'OEM dealer network for sourcing genuine parts directly from manufacturers';
COMMENT ON TABLE "OEMPart" IS 'Cached catalog of OEM parts with pricing and availability';
COMMENT ON TABLE "ShopPartsPreferences" IS 'Shop-specific preferences for parts sourcing and markup';
COMMENT ON TABLE "PartCertification" IS 'Industry certifications for aftermarket parts quality assurance';
COMMENT ON COLUMN "AftermarketPart"."partType" IS 'Type of part: oem, aftermarket, used, remanufactured, rebuilt';
COMMENT ON COLUMN "AftermarketPart"."certifications" IS 'Quality certifications (CAPA, NSF, ISO, etc.)';
COMMENT ON COLUMN "AftermarketPart"."quality" IS 'Quality tier: oem, premium, standard, economy';
