-- Multi-Tenancy Migration: Slugs and Row-Level Security
-- This migration adds slug-based routing and database-level security for 1000+ dealers

-- ============================================
-- PART 1: Add Slug to Shop Table
-- ============================================

-- Add slug column to Shop table (without unique constraint first)
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "slug" TEXT;

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

    -- Remove leading/trailing dashes
    base_slug := TRIM(BOTH '-' FROM base_slug);

    -- If empty, use shop id
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
  END LOOP;
END $$;

-- Now add the unique constraint
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_slug_key" UNIQUE ("slug");

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS "idx_shop_slug" ON "Shop"("slug");

-- Make slug required going forward
ALTER TABLE "Shop" ALTER COLUMN "slug" SET NOT NULL;

-- ============================================
-- PART 2: Enable Row-Level Security
-- ============================================

-- Enable RLS on all tenant-specific tables
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Estimate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EstimateLineItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EstimatePhoto" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EstimateStatusHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartsSupplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartsOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PartsOrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: Create RLS Policies
-- ============================================

-- Function to get current shop ID from JWT or session
CREATE OR REPLACE FUNCTION current_shop_id() RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.current_shop_id', true), '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Shop table policies
CREATE POLICY "shop_isolation" ON "Shop"
  FOR ALL
  USING (id = current_shop_id() OR current_shop_id() IS NULL);

-- User table policies (users belong to a shop)
CREATE POLICY "user_shop_isolation" ON "User"
  FOR ALL
  USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);

-- Estimate policies
CREATE POLICY "estimate_shop_isolation" ON "Estimate"
  FOR ALL
  USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);

-- EstimateLineItem policies (via estimate's shop)
CREATE POLICY "lineitem_shop_isolation" ON "EstimateLineItem"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Estimate"
      WHERE "Estimate"."id" = "EstimateLineItem"."estimateId"
      AND ("Estimate"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
    )
  );

-- EstimatePhoto policies
CREATE POLICY "photo_shop_isolation" ON "EstimatePhoto"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Estimate"
      WHERE "Estimate"."id" = "EstimatePhoto"."estimateId"
      AND ("Estimate"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
    )
  );

-- EstimateStatusHistory policies
CREATE POLICY "status_history_shop_isolation" ON "EstimateStatusHistory"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "Estimate"
      WHERE "Estimate"."id" = "EstimateStatusHistory"."estimateId"
      AND ("Estimate"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
    )
  );

-- ShopSettings policies
CREATE POLICY "settings_shop_isolation" ON "ShopSettings"
  FOR ALL
  USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);

-- PartsSupplier policies
CREATE POLICY "supplier_shop_isolation" ON "PartsSupplier"
  FOR ALL
  USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);

-- PartsOrder policies
CREATE POLICY "order_shop_isolation" ON "PartsOrder"
  FOR ALL
  USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);

-- PartsOrderItem policies (via order's shop)
CREATE POLICY "orderitem_shop_isolation" ON "PartsOrderItem"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "PartsOrder"
      WHERE "PartsOrder"."id" = "PartsOrderItem"."orderId"
      AND ("PartsOrder"."shopId" = current_shop_id() OR current_shop_id() IS NULL)
    )
  );

-- Customer policies
CREATE POLICY "customer_shop_isolation" ON "Customer"
  FOR ALL
  USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);

-- Review policies
CREATE POLICY "review_shop_isolation" ON "Review"
  FOR ALL
  USING ("shopId" = current_shop_id() OR current_shop_id() IS NULL);

-- ============================================
-- PART 4: Service Role Bypass
-- ============================================

-- Allow service role to bypass RLS (for admin operations)
-- This is handled automatically by Supabase service role key

-- ============================================
-- PART 5: Additional Indexes for Performance
-- ============================================

-- Composite indexes for common queries with shopId
CREATE INDEX IF NOT EXISTS "idx_estimate_shop_created" ON "Estimate"("shopId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_estimate_shop_status" ON "Estimate"("shopId", "status");
CREATE INDEX IF NOT EXISTS "idx_user_shop_email" ON "User"("shopId", "email");
CREATE INDEX IF NOT EXISTS "idx_supplier_shop_active" ON "PartsSupplier"("shopId", "isActive");
CREATE INDEX IF NOT EXISTS "idx_order_shop_status" ON "PartsOrder"("shopId", "status");

-- ============================================
-- PART 6: Helper Functions
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
-- VERIFICATION
-- ============================================

-- Verify RLS is enabled
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('Shop', 'User', 'Estimate', 'EstimateLineItem', 'ShopSettings', 'PartsSupplier', 'PartsOrder')
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = tbl.tablename
      AND n.nspname = 'public'
      AND c.relrowsecurity = true
    ) THEN
      RAISE WARNING 'RLS not enabled on table: %', tbl.tablename;
    END IF;
  END LOOP;
END $$;
