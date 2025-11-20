-- =====================================================
-- PHASE 3.1: CUSTOMER REGISTRATION & AUTHENTICATION
-- Customer accounts and estimate linking
-- =====================================================

-- =====================================================
-- 1. CUSTOMER TABLE
-- Customer accounts (separate from shop users)
-- =====================================================
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for Customer
CREATE INDEX IF NOT EXISTS "idx_customer_email" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "idx_customer_phone" ON "Customer"("phoneNumber");

-- =====================================================
-- 2. UPDATE ESTIMATE TABLE
-- Link estimates to customers
-- =====================================================
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "customerId" TEXT REFERENCES "Customer"("id");
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'draft';

-- Index for customer lookup
CREATE INDEX IF NOT EXISTS "idx_estimate_customer" ON "Estimate"("customerId");

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
SELECT
  '✅ Phase 3.1 Migration Complete!' as status,
  'Table Created: Customer' as created,
  'Columns Added: Estimate (customerId, status)' as added;
