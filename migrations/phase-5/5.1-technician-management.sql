-- Phase 5.1: Technician Management System
-- Professional technician tracking, skills, certifications, and job assignment

-- Technician/Employee table
CREATE TABLE IF NOT EXISTS "Technician" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "shopId" TEXT NOT NULL,
  "userId" TEXT, -- Optional link to User account

  -- Personal Info
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "hireDate" DATE NOT NULL,
  "terminationDate" DATE,
  "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'on-leave', 'terminated', 'suspended')),

  -- Employment Details
  "employeeNumber" TEXT,
  "title" TEXT NOT NULL, -- Body Technician, Painter, Detail Specialist, etc.
  "department" TEXT, -- Body Shop, Paint, Detail, etc.
  "payType" TEXT NOT NULL DEFAULT 'hourly' CHECK ("payType" IN ('hourly', 'salary', 'flat-rate', 'commission')),
  "payRate" DECIMAL(10,2),
  "overtimeEligible" BOOLEAN DEFAULT true,

  -- Skills & Experience
  "yearsExperience" INT DEFAULT 0,
  "specialties" TEXT[], -- Frame repair, aluminum, glass, etc.
  "skillLevel" TEXT DEFAULT 'intermediate' CHECK ("skillLevel" IN ('apprentice', 'intermediate', 'senior', 'master')),

  -- Performance Metrics
  "efficiencyRating" DECIMAL(5,2) DEFAULT 100, -- 100 = standard, 120 = 20% faster
  "qualityScore" DECIMAL(5,2) DEFAULT 100, -- Out of 100
  "customerSatisfaction" DECIMAL(5,2), -- Out of 100
  "comebackRate" DECIMAL(5,2), -- Percentage of jobs with issues

  -- Availability
  "hoursPerWeek" INT DEFAULT 40,
  "shiftStart" TIME,
  "shiftEnd" TIME,
  "availableForOvertime" BOOLEAN DEFAULT true,

  -- Additional Info
  "notes" TEXT,
  "profileImageUrl" TEXT,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_shop FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE,
  CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_technician_shop ON "Technician" ("shopId");
CREATE INDEX IF NOT EXISTS idx_technician_status ON "Technician" ("status");
CREATE INDEX IF NOT EXISTS idx_technician_skill ON "Technician" ("skillLevel");

-- Certifications (I-CAR, ASE, etc.)
CREATE TABLE IF NOT EXISTS "Certification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "issuingOrganization" TEXT NOT NULL, -- I-CAR, ASE, etc.
  "description" TEXT,
  "category" TEXT, -- Structural, Non-structural, Refinish, etc.
  "level" TEXT, -- Gold, Platinum, Master, etc.
  "requiresRenewal" BOOLEAN DEFAULT true,
  "renewalMonths" INT, -- How often to renew
  "logoUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Seed common certifications
INSERT INTO "Certification" ("name", "issuingOrganization", "description", "category", "level", "requiresRenewal", "renewalMonths")
VALUES
  ('I-CAR Platinum Individual', 'I-CAR', 'Highest level I-CAR certification for collision repair technicians', 'Structural', 'Platinum', true, 12),
  ('I-CAR Gold Individual', 'I-CAR', 'Gold level I-CAR certification', 'Structural', 'Gold', true, 12),
  ('ASE Master Collision Repair', 'ASE', 'ASE Master Technician certification', 'General', 'Master', true, 60),
  ('ASE Painting and Refinishing', 'ASE', 'ASE Painting and Refinishing certification', 'Refinish', 'Certified', true, 60),
  ('ASE Non-Structural Analysis', 'ASE', 'ASE Non-Structural Analysis and Damage Repair', 'Non-structural', 'Certified', true, 60),
  ('ASE Structural Analysis', 'ASE', 'ASE Structural Analysis and Damage Repair', 'Structural', 'Certified', true, 60),
  ('Aluminum Repair', 'I-CAR', 'Aluminum structural repair certification', 'Structural', 'Certified', true, 24),
  ('Tesla Certified', 'Tesla', 'Tesla certified collision repair', 'OEM', 'Certified', true, 12),
  ('BMW Certified', 'BMW', 'BMW certified collision repair', 'OEM', 'Certified', true, 12),
  ('Mercedes-Benz Certified', 'Mercedes-Benz', 'Mercedes-Benz certified collision repair', 'OEM', 'Certified', true, 12)
ON CONFLICT DO NOTHING;

-- Technician Certifications (junction table)
CREATE TABLE IF NOT EXISTS "TechnicianCertification" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "technicianId" TEXT NOT NULL,
  "certificationId" TEXT NOT NULL,
  "obtainedDate" DATE NOT NULL,
  "expirationDate" DATE,
  "certificateNumber" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "verificationUrl" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_technician FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE,
  CONSTRAINT fk_certification FOREIGN KEY ("certificationId") REFERENCES "Certification"("id") ON DELETE CASCADE,
  UNIQUE ("technicianId", "certificationId")
);

CREATE INDEX IF NOT EXISTS idx_tech_cert_tech ON "TechnicianCertification" ("technicianId");
CREATE INDEX IF NOT EXISTS idx_tech_cert_active ON "TechnicianCertification" ("isActive");
CREATE INDEX IF NOT EXISTS idx_tech_cert_expiry ON "TechnicianCertification" ("expirationDate");

-- Job Assignments
CREATE TABLE IF NOT EXISTS "JobAssignment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "estimateId" TEXT NOT NULL,
  "technicianId" TEXT NOT NULL,

  -- Assignment Details
  "assignedDate" TIMESTAMP DEFAULT NOW(),
  "startDate" TIMESTAMP,
  "completionDate" TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'assigned' CHECK ("status" IN ('assigned', 'in-progress', 'paused', 'completed', 'cancelled')),

  -- Work Details
  "workType" TEXT NOT NULL, -- Disassembly, Body Repair, Paint, Reassembly, etc.
  "estimatedHours" DECIMAL(10,2),
  "actualHours" DECIMAL(10,2),
  "efficiency" DECIMAL(5,2), -- Calculated: estimatedHours / actualHours * 100

  -- Quality Control
  "qcInspectionDate" TIMESTAMP,
  "qcInspectorId" TEXT,
  "qcPassed" BOOLEAN,
  "qcNotes" TEXT,

  -- Notes
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_estimate FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE,
  CONSTRAINT fk_technician FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE,
  CONSTRAINT fk_qc_inspector FOREIGN KEY ("qcInspectorId") REFERENCES "Technician"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_job_assignment_estimate ON "JobAssignment" ("estimateId");
CREATE INDEX IF NOT EXISTS idx_job_assignment_tech ON "JobAssignment" ("technicianId");
CREATE INDEX IF NOT EXISTS idx_job_assignment_status ON "JobAssignment" ("status");

-- Technician Time Tracking
CREATE TABLE IF NOT EXISTS "TechnicianTimeEntry" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "technicianId" TEXT NOT NULL,
  "estimateId" TEXT,
  "jobAssignmentId" TEXT,

  -- Time Details
  "clockIn" TIMESTAMP NOT NULL,
  "clockOut" TIMESTAMP,
  "totalHours" DECIMAL(10,2),
  "billableHours" DECIMAL(10,2),

  -- Work Details
  "workType" TEXT, -- Repair, Paint, Detail, etc.
  "description" TEXT,
  "isBillable" BOOLEAN DEFAULT true,

  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_technician FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE,
  CONSTRAINT fk_estimate FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE SET NULL,
  CONSTRAINT fk_job_assignment FOREIGN KEY ("jobAssignmentId") REFERENCES "JobAssignment"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_time_entry_tech ON "TechnicianTimeEntry" ("technicianId");
CREATE INDEX IF NOT EXISTS idx_time_entry_estimate ON "TechnicianTimeEntry" ("estimateId");
CREATE INDEX IF NOT EXISTS idx_time_entry_date ON "TechnicianTimeEntry" ("clockIn");

-- Technician Skills Matrix
CREATE TABLE IF NOT EXISTS "TechnicianSkill" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "technicianId" TEXT NOT NULL,
  "skillName" TEXT NOT NULL,
  "skillCategory" TEXT, -- Body Repair, Paint, Frame, Electrical, etc.
  "proficiencyLevel" INT NOT NULL DEFAULT 1 CHECK ("proficiencyLevel" >= 1 AND "proficiencyLevel" <= 5),
  "yearsExperience" INT DEFAULT 0,
  "lastUsed" DATE,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_technician FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE CASCADE,
  UNIQUE ("technicianId", "skillName")
);

CREATE INDEX IF NOT EXISTS idx_tech_skill_tech ON "TechnicianSkill" ("technicianId");
CREATE INDEX IF NOT EXISTS idx_tech_skill_proficiency ON "TechnicianSkill" ("proficiencyLevel");

-- Common skills seed data
-- (These would be inserted as technicians are created)

-- Comments
COMMENT ON TABLE "Technician" IS 'Shop technicians/employees with skills, certifications, and performance tracking';
COMMENT ON TABLE "Certification" IS 'Industry certifications (I-CAR, ASE, OEM) available to technicians';
COMMENT ON TABLE "TechnicianCertification" IS 'Junction table linking technicians to their earned certifications';
COMMENT ON TABLE "JobAssignment" IS 'Assignment of technicians to specific jobs/estimates';
COMMENT ON TABLE "TechnicianTimeEntry" IS 'Time tracking for technician work hours';
COMMENT ON TABLE "TechnicianSkill" IS 'Skill proficiency matrix for each technician';

COMMENT ON COLUMN "Technician"."efficiencyRating" IS 'Performance metric: 100 = meets book time, 120 = 20% faster than book time';
COMMENT ON COLUMN "Technician"."skillLevel" IS 'Overall skill level: apprentice, intermediate, senior, master';
COMMENT ON COLUMN "Technician"."payType" IS 'Payment structure: hourly, salary, flat-rate (per job), commission';
COMMENT ON COLUMN "JobAssignment"."efficiency" IS 'Calculated efficiency for this job: (estimated / actual) * 100';
COMMENT ON COLUMN "TechnicianSkill"."proficiencyLevel" IS '1=Beginner, 2=Intermediate, 3=Advanced, 4=Expert, 5=Master';
