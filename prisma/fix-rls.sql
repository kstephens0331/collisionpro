-- ============================================
-- CollisionPro - FIX RLS POLICIES
-- ============================================
-- This disables RLS or creates permissive policies
-- Run this if registration is failing with 500 error
-- ============================================

-- Option 1: Disable RLS entirely (easiest for development)
ALTER TABLE "Shop" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "RateProfile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" DISABLE ROW LEVEL SECURITY;

-- If you prefer to keep RLS enabled, use Option 2 instead:
-- (Comment out Option 1 above and uncomment Option 2 below)

/*
-- Option 2: Create fully permissive policies
-- Drop existing policies
DROP POLICY IF EXISTS "Shop: Enable all for service role" ON "Shop";
DROP POLICY IF EXISTS "User: Enable all for service role" ON "User";
DROP POLICY IF EXISTS "RateProfile: Enable all for service role" ON "RateProfile";
DROP POLICY IF EXISTS "Account: Enable all for service role" ON "Account";
DROP POLICY IF EXISTS "Session: Enable all for service role" ON "Session";
DROP POLICY IF EXISTS "VerificationToken: Enable all for service role" ON "VerificationToken";

-- Create new permissive policies
CREATE POLICY "Enable all access" ON "Shop" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON "User" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON "RateProfile" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON "Account" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON "Session" FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON "VerificationToken" FOR ALL USING (true) WITH CHECK (true);
*/

-- Verify RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
