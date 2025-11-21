-- =============================================
-- DRP (Direct Repair Program) Integration
-- =============================================
-- Manages relationships with insurance carriers
-- Tracks program requirements, compliance, and performance

-- Insurance Carriers Table
CREATE TABLE IF NOT EXISTS "InsuranceCarrier" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "abbreviation" TEXT,
  "contactName" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "website" TEXT,
  "claimsPortalUrl" TEXT,
  "claimsPhone" TEXT,
  "notes" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Common insurance carriers seed data
INSERT INTO "InsuranceCarrier" ("id", "name", "abbreviation", "claimsPhone") VALUES
  ('carrier-1', 'State Farm', 'SF', '1-800-STATE-FARM'),
  ('carrier-2', 'GEICO', 'GEICO', '1-800-841-3000'),
  ('carrier-3', 'Progressive', 'PROG', '1-800-274-4499'),
  ('carrier-4', 'Allstate', 'ALL', '1-800-255-7828'),
  ('carrier-5', 'USAA', 'USAA', '1-800-531-8722'),
  ('carrier-6', 'Liberty Mutual', 'LM', '1-800-290-6711'),
  ('carrier-7', 'Farmers', 'FARM', '1-800-435-7764'),
  ('carrier-8', 'Nationwide', 'NW', '1-800-421-3535'),
  ('carrier-9', 'American Family', 'AF', '1-800-692-6326'),
  ('carrier-10', 'Travelers', 'TRAV', '1-800-252-4633')
ON CONFLICT (id) DO NOTHING;

-- DRP Programs Table
CREATE TABLE IF NOT EXISTS "DRPProgram" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "carrierId" TEXT NOT NULL REFERENCES "InsuranceCarrier"("id"),

  -- Program Details
  "programName" TEXT NOT NULL,
  "enrollmentDate" TIMESTAMP NOT NULL,
  "status" TEXT DEFAULT 'active', -- active, pending, suspended, terminated
  "tierLevel" TEXT, -- gold, silver, bronze, preferred, etc.

  -- Requirements
  "minCSIScore" DECIMAL(5,2), -- Customer Satisfaction Index
  "maxCycleTime" INTEGER, -- Days
  "requiresPreApproval" BOOLEAN DEFAULT false,
  "requiresPhotos" BOOLEAN DEFAULT true,
  "requiresSupplement" BOOLEAN DEFAULT false,
  "certificationRequired" TEXT[], -- I-CAR Gold, ASE, etc.

  -- Financial Terms
  "laborRate" DECIMAL(10,2),
  "paintRate" DECIMAL(10,2),
  "paintMaterialsRate" DECIMAL(10,2),
  "discountPercentage" DECIMAL(5,2) DEFAULT 0,
  "paymentTerms" TEXT, -- Net 30, Net 45, etc.

  -- Volume Requirements
  "minMonthlyJobs" INTEGER,
  "minAnnualJobs" INTEGER,

  -- Performance Metrics
  "currentCSIScore" DECIMAL(5,2),
  "avgCycleTime" DECIMAL(10,2),
  "completedJobsThisMonth" INTEGER DEFAULT 0,
  "completedJobsThisYear" INTEGER DEFAULT 0,

  -- Contacts
  "accountManagerName" TEXT,
  "accountManagerEmail" TEXT,
  "accountManagerPhone" TEXT,

  -- Compliance
  "lastAuditDate" TIMESTAMP,
  "nextAuditDate" TIMESTAMP,
  "complianceStatus" TEXT DEFAULT 'compliant', -- compliant, warning, non-compliant
  "complianceNotes" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("shopId", "carrierId")
);

-- DRP Requirements Table (specific requirements per program)
CREATE TABLE IF NOT EXISTS "DRPRequirement" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "programId" TEXT NOT NULL REFERENCES "DRPProgram"("id") ON DELETE CASCADE,
  "category" TEXT NOT NULL, -- certification, equipment, process, reporting, etc.
  "requirement" TEXT NOT NULL,
  "description" TEXT,
  "isMandatory" BOOLEAN DEFAULT true,
  "dueDate" TIMESTAMP,
  "completedDate" TIMESTAMP,
  "status" TEXT DEFAULT 'pending', -- pending, in-progress, completed, overdue
  "verificationMethod" TEXT, -- audit, self-report, documentation, etc.
  "documentUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- DRP Performance Metrics Table (historical tracking)
CREATE TABLE IF NOT EXISTS "DRPMetric" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "programId" TEXT NOT NULL REFERENCES "DRPProgram"("id") ON DELETE CASCADE,
  "metricDate" DATE NOT NULL,
  "period" TEXT DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, annual

  -- Volume Metrics
  "jobsCompleted" INTEGER DEFAULT 0,
  "jobsInProgress" INTEGER DEFAULT 0,
  "totalRevenue" DECIMAL(12,2) DEFAULT 0,

  -- Quality Metrics
  "csiScore" DECIMAL(5,2),
  "avgCycleTime" DECIMAL(10,2),
  "firstTimeFixRate" DECIMAL(5,2), -- Percentage
  "comebackRate" DECIMAL(5,2), -- Percentage

  -- Compliance Metrics
  "onTimeDeliveryRate" DECIMAL(5,2), -- Percentage
  "supplementRate" DECIMAL(5,2), -- Percentage of jobs requiring supplement
  "avgSupplementAmount" DECIMAL(10,2),

  -- Financial Metrics
  "avgRepairCost" DECIMAL(10,2),
  "avgLaborHours" DECIMAL(10,2),
  "avgPartsMargin" DECIMAL(5,2), -- Percentage

  "createdAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("programId", "metricDate", "period")
);

-- DRP Compliance Alerts Table
CREATE TABLE IF NOT EXISTS "DRPAlert" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "programId" TEXT NOT NULL REFERENCES "DRPProgram"("id") ON DELETE CASCADE,
  "alertType" TEXT NOT NULL, -- csi-low, cycle-time-high, volume-low, audit-due, certification-expiring
  "severity" TEXT DEFAULT 'warning', -- info, warning, critical
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "actionRequired" TEXT,
  "dueDate" TIMESTAMP,
  "status" TEXT DEFAULT 'active', -- active, acknowledged, resolved, dismissed
  "acknowledgedBy" TEXT,
  "acknowledgedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- DRP Estimate Association (link estimates to DRP programs)
CREATE TABLE IF NOT EXISTS "DRPEstimate" (
  "estimateId" TEXT PRIMARY KEY REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "programId" TEXT NOT NULL REFERENCES "DRPProgram"("id"),
  "claimNumber" TEXT,
  "adjusterName" TEXT,
  "adjusterEmail" TEXT,
  "adjusterPhone" TEXT,
  "preApprovalRequired" BOOLEAN DEFAULT false,
  "preApprovalStatus" TEXT, -- pending, approved, denied
  "preApprovalDate" TIMESTAMP,
  "supplementRequired" BOOLEAN DEFAULT false,
  "supplementAmount" DECIMAL(10,2),
  "supplementApprovedDate" TIMESTAMP,
  "cycleTimeStart" TIMESTAMP,
  "cycleTimeEnd" TIMESTAMP,
  "cycleTimeDays" INTEGER,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_drp_program_shop ON "DRPProgram"("shopId");
CREATE INDEX IF NOT EXISTS idx_drp_program_carrier ON "DRPProgram"("carrierId");
CREATE INDEX IF NOT EXISTS idx_drp_program_status ON "DRPProgram"("status");
CREATE INDEX IF NOT EXISTS idx_drp_requirement_program ON "DRPRequirement"("programId");
CREATE INDEX IF NOT EXISTS idx_drp_requirement_status ON "DRPRequirement"("status");
CREATE INDEX IF NOT EXISTS idx_drp_metric_program ON "DRPMetric"("programId");
CREATE INDEX IF NOT EXISTS idx_drp_metric_date ON "DRPMetric"("metricDate");
CREATE INDEX IF NOT EXISTS idx_drp_alert_program ON "DRPAlert"("programId");
CREATE INDEX IF NOT EXISTS idx_drp_alert_status ON "DRPAlert"("status");
CREATE INDEX IF NOT EXISTS idx_drp_estimate_program ON "DRPEstimate"("programId");

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_drp_program_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_drp_program_timestamp
BEFORE UPDATE ON "DRPProgram"
FOR EACH ROW
EXECUTE FUNCTION update_drp_program_timestamp();
