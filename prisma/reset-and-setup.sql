-- ============================================
-- CollisionPro - COMPLETE DATABASE RESET & SETUP
-- ============================================
-- This script will:
-- 1. Drop all existing tables
-- 2. Create fresh schema
-- 3. Set up proper indexes
-- 4. Configure RLS policies
-- ============================================

-- STEP 1: DROP ALL EXISTING TABLES (if they exist)
-- ============================================
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "RateProfile" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Shop" CASCADE;

-- STEP 2: CREATE FRESH SCHEMA
-- ============================================

-- Shop Table (Multi-tenant foundation)
CREATE TABLE "Shop" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "logoUrl" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'trial',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User Table (Shop employees/admins)
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "shopId" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'estimator',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId")
        REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RateProfile Table (Labor, paint, markup rates per shop)
CREATE TABLE "RateProfile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "laborRate" DOUBLE PRECISION NOT NULL DEFAULT 50.00,
    "paintRate" DOUBLE PRECISION NOT NULL DEFAULT 45.00,
    "markupPercentage" DOUBLE PRECISION NOT NULL DEFAULT 30.00,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 8.25,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RateProfile_shopId_fkey" FOREIGN KEY ("shopId")
        REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- NextAuth Account Table (OAuth providers)
CREATE TABLE "Account" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_provider_providerAccountId_key"
        UNIQUE ("provider", "providerAccountId")
);

-- NextAuth Session Table (Active user sessions)
CREATE TABLE "Session" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- NextAuth VerificationToken Table (Email verification, password reset)
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationToken_identifier_token_key"
        UNIQUE ("identifier", "token")
);

-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX "User_shopId_idx" ON "User"("shopId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "RateProfile_shopId_idx" ON "RateProfile"("shopId");

-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE "Shop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;

-- STEP 5: CREATE RLS POLICIES (Allow service role full access)
-- ============================================

-- Shop policies
DROP POLICY IF EXISTS "Shop: Enable all for service role" ON "Shop";
CREATE POLICY "Shop: Enable all for service role" ON "Shop"
    FOR ALL USING (true) WITH CHECK (true);

-- User policies
DROP POLICY IF EXISTS "User: Enable all for service role" ON "User";
CREATE POLICY "User: Enable all for service role" ON "User"
    FOR ALL USING (true) WITH CHECK (true);

-- RateProfile policies
DROP POLICY IF EXISTS "RateProfile: Enable all for service role" ON "RateProfile";
CREATE POLICY "RateProfile: Enable all for service role" ON "RateProfile"
    FOR ALL USING (true) WITH CHECK (true);

-- Account policies
DROP POLICY IF EXISTS "Account: Enable all for service role" ON "Account";
CREATE POLICY "Account: Enable all for service role" ON "Account"
    FOR ALL USING (true) WITH CHECK (true);

-- Session policies
DROP POLICY IF EXISTS "Session: Enable all for service role" ON "Session";
CREATE POLICY "Session: Enable all for service role" ON "Session"
    FOR ALL USING (true) WITH CHECK (true);

-- VerificationToken policies
DROP POLICY IF EXISTS "VerificationToken: Enable all for service role" ON "VerificationToken";
CREATE POLICY "VerificationToken: Enable all for service role" ON "VerificationToken"
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Verify tables exist:
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
