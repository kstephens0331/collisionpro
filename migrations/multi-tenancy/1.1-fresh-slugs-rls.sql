-- Multi-Tenancy Migration: Slugs and Row-Level Security
-- Fresh start - run this after cleaning up any partial attempts
-- This migration adds slug-based routing and database-level security for 1000+ dealers

-- ============================================
-- PART 0: Cleanup any partial migration attempts
-- ============================================

-- Drop constraint if exists (ignore errors)
ALTER TABLE "Shop" DROP CONSTRAINT IF EXISTS "Shop_slug_key";

-- Drop index if exists
DROP INDEX IF EXISTS "idx_shop_slug";

-- Drop column if exists and re-add it fresh
ALTER TABLE "Shop" DROP COLUMN IF EXISTS "slug";

-- ============================================
-- PART 1: Add Slug to Shop Table
-- ============================================

-- Add slug column
ALTER TABLE "Shop" ADD COLUMN "slug" TEXT;

-- Generate unique slugs for existing shops using a function
DO $$
DECLARE
  shop_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR shop_record IN SELECT id, name FROM "Shop" WHERE slug IS NULL ORDER BY "createdAt" ASC LOOP
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(shop_record.name, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));

    -- Remove leading/trailing dashes and multiple dashes
    base_slug := TRIM(BOTH '-' FROM base_slug);
    base_slug := REGEXP_REPLACE(base_slug, '-+', '-', 'g');

    -- If empty, use 'shop' as base
    IF base_slug = '' OR base_slug IS NULL THEN
      base_slug := 'shop';
    END IF;

    -- Check for uniqueness and append counter if needed
    final_slug := base_slug;
    counter := 1;

    WHILE EXISTS (SELECT 1 FROM "Shop" WHERE slug = final_slug AND id != shop_record.id) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;

    -- Update the shop with the unique slug
    UPDATE "Shop" SET slug = final_slug WHERE id = shop_record.id;

    RAISE NOTICE 'Shop % -> slug: %', shop_record.name, final_slug;
  END LOOP;
END $$;

-- Now add the unique constraint
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_slug_key" UNIQUE ("slug");

-- Create index for fast slug lookups
CREATE INDEX "idx_shop_slug" ON "Shop"("slug");

-- Make slug required going forward
ALTER TABLE "Shop" ALTER COLUMN "slug" SET NOT NULL;

-- ============================================
-- PART 2: Enable Row-Level Security
-- ============================================

-- Enable RLS on all tenant-specific tables (with error handling for missing tables)
DO $$ BEGIN ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "User" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Estimate" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EstimateLineItem" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EstimatePhoto" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "EstimateStatusHistory" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "ShopSettings" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PartsSupplier" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PartsOrder" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "PartsOrderItem" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================
-- PART 3: Create RLS Policies
-- ============================================

-- Function to get current shop ID from session
CREATE OR REPLACE FUNCTION current_shop_id() RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_shop_id', true), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist (for re-runs) - with error handling
DO $$ BEGIN DROP POLICY IF EXISTS "shop_isolation" ON "Shop"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "user_shop_isolation" ON "User"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "estimate_shop_isolation" ON "Estimate"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "lineitem_shop_isolation" ON "EstimateLineItem"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "photo_shop_isolation" ON "EstimatePhoto"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "status_history_shop_isolation" ON "EstimateStatusHistory"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "settings_shop_isolation" ON "ShopSettings"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "supplier_shop_isolation" ON "PartsSupplier"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "order_shop_isolation" ON "PartsOrder"; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DROP POLICY IF EXISTS "orderitem_shop_isolation" ON "PartsOrderItem"; EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Create policies with error handling for missing tables

-- Shop table policies
DO $$ BEGIN
  CREATE POLICY "shop_isolation" ON "Shop"
    FOR ALL
    USING (id = current_shop_id() OR current_shop_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- User table policies
DO $$ BEGIN
  CREATE POLICY "user_shop_isolation" ON "User"
    FOR ALL
    USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- Estimate policies
DO $$ BEGIN
  CREATE POLICY "estimate_shop_isolation" ON "Estimate"
    FOR ALL
    USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- EstimateLineItem policies
DO $$ BEGIN
  CREATE POLICY "lineitem_shop_isolation" ON "EstimateLineItem"
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM "Estimate"
        WHERE "Estimate"."id" = "EstimateLineItem"."estimateId"
        AND ("Estimate"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
      )
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- EstimatePhoto policies
DO $$ BEGIN
  CREATE POLICY "photo_shop_isolation" ON "EstimatePhoto"
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM "Estimate"
        WHERE "Estimate"."id" = "EstimatePhoto"."estimateId"
        AND ("Estimate"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
      )
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- EstimateStatusHistory policies
DO $$ BEGIN
  CREATE POLICY "status_history_shop_isolation" ON "EstimateStatusHistory"
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM "Estimate"
        WHERE "Estimate"."id" = "EstimateStatusHistory"."estimateId"
        AND ("Estimate"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
      )
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ShopSettings policies
DO $$ BEGIN
  CREATE POLICY "settings_shop_isolation" ON "ShopSettings"
    FOR ALL
    USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- PartsSupplier policies
DO $$ BEGIN
  CREATE POLICY "supplier_shop_isolation" ON "PartsSupplier"
    FOR ALL
    USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- PartsOrder policies
DO $$ BEGIN
  CREATE POLICY "order_shop_isolation" ON "PartsOrder"
    FOR ALL
    USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- PartsOrderItem policies
DO $$ BEGIN
  CREATE POLICY "orderitem_shop_isolation" ON "PartsOrderItem"
    FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM "PartsOrder"
        WHERE "PartsOrder"."id" = "PartsOrderItem"."orderId"
        AND ("PartsOrder"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
      )
    );
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================
-- PART 4: Helper Functions
-- ============================================

-- Function to set current shop context (called from API)
CREATE OR REPLACE FUNCTION set_shop_context(shop_id TEXT) RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_shop_id', shop_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shop by slug
CREATE OR REPLACE FUNCTION get_shop_by_slug(shop_slug TEXT)
RETURNS TABLE(id TEXT, name TEXT, slug TEXT) AS $$
BEGIN
  RETURN QUERY SELECT s.id, s.name, s.slug FROM "Shop" s WHERE s.slug = shop_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 5: Performance Indexes
-- ============================================

-- Composite indexes for common queries with shopId (with error handling)
DO $$ BEGIN CREATE INDEX IF NOT EXISTS "idx_estimate_shop_created" ON "Estimate"("shopId", "createdAt" DESC); EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS "idx_estimate_shop_status" ON "Estimate"("shopId", "status"); EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS "idx_user_shop_email" ON "User"("shopId", "email"); EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS "idx_supplier_shop_active" ON "PartsSupplier"("shopId", "isActive"); EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN CREATE INDEX IF NOT EXISTS "idx_order_shop_status" ON "PartsOrder"("shopId", "status"); EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Show generated slugs
SELECT id, name, slug FROM "Shop" ORDER BY name;
