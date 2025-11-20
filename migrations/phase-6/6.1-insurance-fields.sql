-- Phase 6: Insurance DRP Integration
-- Add insurance-related fields to Estimate table

-- Insurance submission fields
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceClaimNumber" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceCompany" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insurancePlatform" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceStatus" TEXT DEFAULT 'pending';
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceExternalId" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceSubmittedAt" TIMESTAMP;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insurancePolicyNumber" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceDateOfLoss" DATE;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceDeductible" DECIMAL(10, 2);

-- Adjuster information
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceAdjusterName" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceAdjusterEmail" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceAdjusterPhone" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceAdjusterNotes" TEXT;

-- Approval tracking
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceApprovedAt" TIMESTAMP;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceApprovedAmount" DECIMAL(10, 2);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "insuranceLastCheckedAt" TIMESTAMP;

-- Supplement fields
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "hasActiveSupplement" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "supplementReason" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "supplementAmount" DECIMAL(10, 2);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "supplementSubmittedAt" TIMESTAMP;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "supplementStatus" TEXT;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "supplementApprovedAmount" DECIMAL(10, 2);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "supplementApprovedAt" TIMESTAMP;

-- Create index for insurance queries
CREATE INDEX IF NOT EXISTS "Estimate_insuranceClaimNumber_idx" ON "Estimate"("insuranceClaimNumber");
CREATE INDEX IF NOT EXISTS "Estimate_insuranceExternalId_idx" ON "Estimate"("insuranceExternalId");
CREATE INDEX IF NOT EXISTS "Estimate_insuranceStatus_idx" ON "Estimate"("insuranceStatus");
CREATE INDEX IF NOT EXISTS "Estimate_insurancePlatform_idx" ON "Estimate"("insurancePlatform");

-- Insurance submissions history table (for full audit trail)
CREATE TABLE IF NOT EXISTS "InsuranceSubmission" (
    "id" TEXT PRIMARY KEY,
    "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
    "shopId" TEXT NOT NULL DEFAULT 'default',

    -- Submission details
    "platform" TEXT NOT NULL,
    "claimNumber" TEXT NOT NULL,
    "externalId" TEXT,
    "status" TEXT DEFAULT 'pending',

    -- Insurance info
    "insuranceCompany" TEXT,
    "policyNumber" TEXT,
    "dateOfLoss" DATE,
    "deductible" DECIMAL(10, 2),

    -- Adjuster
    "adjusterName" TEXT,
    "adjusterEmail" TEXT,
    "adjusterPhone" TEXT,
    "adjusterNotes" TEXT,

    -- Approval
    "submittedAt" TIMESTAMP DEFAULT NOW(),
    "approvedAt" TIMESTAMP,
    "approvedAmount" DECIMAL(10, 2),

    -- Response data
    "responseData" JSONB,
    "errorMessage" TEXT,

    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on InsuranceSubmission
ALTER TABLE "InsuranceSubmission" ENABLE ROW LEVEL SECURITY;

-- RLS policy for InsuranceSubmission
CREATE POLICY "insurance_submission_access" ON "InsuranceSubmission"
  FOR ALL
  USING (true);

-- Supplements table
CREATE TABLE IF NOT EXISTS "InsuranceSupplement" (
    "id" TEXT PRIMARY KEY,
    "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
    "submissionId" TEXT REFERENCES "InsuranceSubmission"("id") ON DELETE SET NULL,
    "shopId" TEXT NOT NULL DEFAULT 'default',

    -- Supplement details
    "reason" TEXT NOT NULL,
    "totalAmount" DECIMAL(10, 2) NOT NULL,
    "status" TEXT DEFAULT 'pending',

    -- Items (stored as JSONB for flexibility)
    "items" JSONB NOT NULL DEFAULT '[]',

    -- Photos
    "photos" TEXT[] DEFAULT '{}',

    -- Response
    "submittedAt" TIMESTAMP,
    "approvedAt" TIMESTAMP,
    "approvedAmount" DECIMAL(10, 2),
    "adjusterNotes" TEXT,

    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on InsuranceSupplement
ALTER TABLE "InsuranceSupplement" ENABLE ROW LEVEL SECURITY;

-- RLS policy for InsuranceSupplement
CREATE POLICY "insurance_supplement_access" ON "InsuranceSupplement"
  FOR ALL
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS "InsuranceSubmission_estimateId_idx" ON "InsuranceSubmission"("estimateId");
CREATE INDEX IF NOT EXISTS "InsuranceSubmission_shopId_idx" ON "InsuranceSubmission"("shopId");
CREATE INDEX IF NOT EXISTS "InsuranceSubmission_claimNumber_idx" ON "InsuranceSubmission"("claimNumber");
CREATE INDEX IF NOT EXISTS "InsuranceSupplement_estimateId_idx" ON "InsuranceSupplement"("estimateId");
CREATE INDEX IF NOT EXISTS "InsuranceSupplement_shopId_idx" ON "InsuranceSupplement"("shopId");

-- Grant permissions
GRANT ALL ON "InsuranceSubmission" TO authenticated;
GRANT ALL ON "InsuranceSubmission" TO service_role;
GRANT ALL ON "InsuranceSupplement" TO authenticated;
GRANT ALL ON "InsuranceSupplement" TO service_role;

COMMENT ON TABLE "InsuranceSubmission" IS 'Tracks all insurance estimate submissions to CCC ONE, Mitchell, Audatex';
COMMENT ON TABLE "InsuranceSupplement" IS 'Tracks supplement requests submitted to insurance companies';
