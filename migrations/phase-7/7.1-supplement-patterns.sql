-- Phase 7: Automated Supplement Detection
-- Supplement pattern analysis and recommendation tables

-- ============================================================================
-- SUPPLEMENT PATTERNS TABLE
-- Stores historical patterns for supplement predictions
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SupplementPattern" (
  "id" TEXT PRIMARY KEY,

  -- Vehicle identification
  "vehicleMake" TEXT,
  "vehicleModel" TEXT,
  "vehicleYear" INTEGER,

  -- Damage characteristics
  "damageLocation" TEXT, -- "Front End", "Rear Quarter", "Door", etc.
  "initialDamageType" TEXT, -- "Impact", "Scrape", "Dent", "Crack", etc.
  "initialEstimateRange" TEXT, -- "$0-2K", "$2K-5K", "$5K-10K", "$10K+"

  -- Supplement details
  "supplementTrigger" TEXT NOT NULL, -- "Hidden frame damage", "Rust perforation", etc.
  "supplementCategory" TEXT NOT NULL, -- "labor", "parts", "paint", "other"
  "supplementType" TEXT, -- "Frame", "Mechanical", "Electrical", "Corrosion", etc.

  -- Statistical metrics
  "frequencyCount" INTEGER DEFAULT 1, -- How many times this pattern occurred
  "approvalCount" INTEGER DEFAULT 0, -- How many were approved
  "rejectionCount" INTEGER DEFAULT 0, -- How many were rejected
  "avgApprovalRate" DECIMAL(5, 2), -- Percentage approved
  "avgAmount" DECIMAL(10, 2), -- Average supplement amount
  "avgDaysToApproval" DECIMAL(5, 2), -- How long to get approved

  -- Machine learning
  "confidenceScore" DECIMAL(5, 2) DEFAULT 50.0, -- 0-100, how confident are we?
  "lastSeenAt" TIMESTAMP, -- When we last saw this pattern

  -- Metadata
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SUPPLEMENT RECOMMENDATIONS TABLE
-- Tracks AI-generated supplement recommendations
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SupplementRecommendation" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "shopId" TEXT NOT NULL DEFAULT 'default',

  -- Recommendation details
  "trigger" TEXT NOT NULL, -- What triggered this recommendation
  "category" TEXT NOT NULL, -- "labor", "parts", "paint", "other"
  "confidence" DECIMAL(5, 2) NOT NULL, -- 0-100, how confident is the AI?
  "suggestedAmount" DECIMAL(10, 2), -- Predicted supplement amount
  "justification" TEXT, -- Ready-to-send justification text for insurance
  "documentationNeeded" TEXT[], -- ["Photos of frame", "Measurements", etc.]

  -- Pattern references
  "relatedPatterns" JSONB DEFAULT '[]', -- Array of pattern IDs that contributed to this recommendation

  -- Outcome tracking (for learning)
  "wasAccepted" BOOLEAN DEFAULT FALSE, -- Did shop accept the recommendation?
  "wasSubmitted" BOOLEAN DEFAULT FALSE, -- Did shop submit a supplement?
  "wasApproved" BOOLEAN, -- Did insurance approve it?
  "actualAmount" DECIMAL(10, 2), -- Actual approved amount
  "actualSubmissionId" TEXT REFERENCES "InsuranceSupplement"("id") ON DELETE SET NULL,

  -- Feedback loop
  "feedback" TEXT, -- Shop can provide feedback
  "accuracyScore" DECIMAL(5, 2), -- How accurate was the prediction? (calculated)

  -- Metadata
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "dismissedAt" TIMESTAMP, -- If shop dismissed the recommendation
  "acceptedAt" TIMESTAMP -- If shop accepted the recommendation
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Pattern lookup indexes
CREATE INDEX IF NOT EXISTS "SupplementPattern_vehicle_idx"
  ON "SupplementPattern"("vehicleMake", "vehicleModel", "vehicleYear");

CREATE INDEX IF NOT EXISTS "SupplementPattern_damage_idx"
  ON "SupplementPattern"("damageLocation", "initialDamageType");

CREATE INDEX IF NOT EXISTS "SupplementPattern_confidence_idx"
  ON "SupplementPattern"("confidenceScore" DESC);

CREATE INDEX IF NOT EXISTS "SupplementPattern_frequency_idx"
  ON "SupplementPattern"("frequencyCount" DESC);

CREATE INDEX IF NOT EXISTS "SupplementPattern_category_idx"
  ON "SupplementPattern"("supplementCategory");

-- Recommendation lookup indexes
CREATE INDEX IF NOT EXISTS "SupplementRecommendation_estimateId_idx"
  ON "SupplementRecommendation"("estimateId");

CREATE INDEX IF NOT EXISTS "SupplementRecommendation_shopId_idx"
  ON "SupplementRecommendation"("shopId");

CREATE INDEX IF NOT EXISTS "SupplementRecommendation_confidence_idx"
  ON "SupplementRecommendation"("confidence" DESC);

CREATE INDEX IF NOT EXISTS "SupplementRecommendation_wasAccepted_idx"
  ON "SupplementRecommendation"("wasAccepted");

CREATE INDEX IF NOT EXISTS "SupplementRecommendation_createdAt_idx"
  ON "SupplementRecommendation"("createdAt" DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE "SupplementPattern" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupplementRecommendation" ENABLE ROW LEVEL SECURITY;

-- Pattern policies (patterns are public for all shops to learn from)
CREATE POLICY "supplement_pattern_access"
  ON "SupplementPattern" FOR ALL
  USING (true);

-- Recommendation policies (simple policy for now)
CREATE POLICY "supplement_recommendation_access"
  ON "SupplementRecommendation" FOR ALL
  USING (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON "SupplementPattern" TO authenticated;
GRANT ALL ON "SupplementPattern" TO service_role;
GRANT ALL ON "SupplementRecommendation" TO authenticated;
GRANT ALL ON "SupplementRecommendation" TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE "SupplementPattern" IS 'Historical supplement patterns for AI-powered predictions';
COMMENT ON TABLE "SupplementRecommendation" IS 'AI-generated supplement recommendations with outcome tracking';

COMMENT ON COLUMN "SupplementPattern"."confidenceScore" IS 'AI confidence in this pattern (0-100), based on approval rate and frequency';
COMMENT ON COLUMN "SupplementPattern"."frequencyCount" IS 'How many times this pattern has occurred';
COMMENT ON COLUMN "SupplementPattern"."avgApprovalRate" IS 'Percentage of supplements with this pattern that were approved';

COMMENT ON COLUMN "SupplementRecommendation"."confidence" IS 'AI confidence in this recommendation (0-100)';
COMMENT ON COLUMN "SupplementRecommendation"."justification" IS 'Ready-to-send justification text for insurance adjuster';
COMMENT ON COLUMN "SupplementRecommendation"."accuracyScore" IS 'How accurate was this prediction? (calculated after outcome known)';
