# Phase 7: Automated Supplement Detection

**Duration**: Weeks 15-16 (2 weeks)
**Status**: 🚧 IN PROGRESS
**Start Date**: 2025-11-19

---

## Overview

Phase 7 adds intelligent supplement detection and recommendation capabilities to help shops identify potential hidden damage before disassembly, reducing cycle time and improving profitability.

**Key Features**:
- Historical supplement analysis
- Pre-disassembly predictions
- AI-powered supplement recommendations
- Supplement success tracking
- Pattern recognition across vehicles

**Business Impact**:
- Reduce supplement cycle time by 50% (identify before disassembly)
- Increase supplement approval rate to >90%
- Improve shop profitability (supplements = additional revenue)
- Reduce vehicle down time

---

## Sub-Phases

### 7.1: Historical Supplement Analysis (2 days)

**Objective**: Build a foundation for supplement predictions by analyzing historical supplement data.

**Features**:
- Analyze all approved supplements in database
- Identify common patterns (vehicle type, damage location, initial damage)
- Build statistical models for supplement likelihood
- Train basic ML prediction model

**Database Schema**:
```sql
-- Already exists from Phase 6
CREATE TABLE insurance_supplements (
  id UUID PRIMARY KEY,
  estimate_id UUID REFERENCES estimates(id),
  reason TEXT NOT NULL,
  total_amount DECIMAL(10, 2),
  items JSONB,
  status VARCHAR(30),
  approved_amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ
);

-- Add pattern tracking table
CREATE TABLE supplement_patterns (
  id UUID PRIMARY KEY,
  vehicle_make VARCHAR(50),
  vehicle_model VARCHAR(50),
  vehicle_year INTEGER,
  damage_location VARCHAR(100),
  initial_damage_type VARCHAR(50),
  supplement_trigger VARCHAR(200),
  frequency_count INTEGER,
  avg_approval_rate DECIMAL(5, 2),
  avg_amount DECIMAL(10, 2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**API Endpoints**:
- `GET /api/supplements/patterns` - Get supplement patterns
- `GET /api/supplements/analytics` - Supplement analytics dashboard
- `POST /api/supplements/analyze` - Analyze historical data

**Deliverables**:
- [ ] Supplement pattern analysis algorithm
- [ ] Pattern storage database
- [ ] Analytics API endpoints
- [ ] Pattern extraction script

---

### 7.2: Pre-Disassembly Suggestions (2 days)

**Objective**: Scan estimates before repair starts and suggest likely supplements.

**Features**:
- Scan estimate for supplement trigger conditions
- Compare to historical patterns
- Calculate supplement probability
- Suggest documentation needs (photos, measurements)
- Generate pre-disassembly checklist

**Trigger Conditions**:
1. **High-Impact Collisions**
   - Initial estimate >$5,000
   - Front/rear end damage
   - Airbag deployment
   - → Likely: Frame damage, sensor replacement

2. **Water/Flood Exposure**
   - Date of loss during rain/flood
   - Low-area damage
   - → Likely: Electrical issues, carpet/padding

3. **Age-Related**
   - Vehicle >10 years old
   - Rust-belt states
   - → Likely: Corrosion, frozen bolts, extra labor

4. **Part Availability Issues**
   - Exotic/luxury vehicles
   - Discontinued models
   - → Likely: Part delays, alternative solutions

**UI Component**:
```tsx
<SupplementSuggestions
  estimateId={estimateId}
  onAcceptSuggestion={(suggestion) => addToSupplementList(suggestion)}
/>
```

**API Endpoints**:
- `GET /api/supplements/suggestions?estimateId=xxx` - Get pre-disassembly suggestions
- `POST /api/supplements/accept-suggestion` - Accept and track suggestion

**Deliverables**:
- [ ] Trigger condition engine
- [ ] Pre-disassembly suggestions API
- [ ] Suggestion UI component
- [ ] Documentation checklist generator

---

### 7.3: Supplement Recommendation Engine (2 days)

**Objective**: Real-time intelligent supplement recommendations during repair process.

**Features**:
- Monitor estimate for changes
- Real-time supplement suggestions
- Confidence scoring (0-100%)
- Justification generation for insurance
- Part/labor recommendations

**Recommendation Algorithm**:
```typescript
interface SupplementRecommendation {
  id: string;
  confidence: number; // 0-100
  trigger: string; // What caused this suggestion
  category: 'labor' | 'parts' | 'paint' | 'other';
  suggestedAmount: number;
  justification: string; // Ready-to-send to insurance
  documentation: string[]; // Photos/docs needed
  relatedPatterns: Pattern[];
}

function generateSupplementRecommendation(
  estimate: Estimate,
  currentDamage: Damage[],
  historicalPatterns: Pattern[]
): SupplementRecommendation[]
```

**Confidence Scoring Factors**:
- Historical frequency: 40%
- Vehicle match: 25%
- Damage similarity: 20%
- Shop-specific history: 15%

**Justification Templates**:
```
"Based on disassembly, discovered hidden damage to [PART] not visible during initial inspection. [DESCRIPTION]. Photos attached showing [EVIDENCE]. Recommend [ACTION]."
```

**API Endpoints**:
- `GET /api/supplements/recommendations?estimateId=xxx` - Get recommendations
- `POST /api/supplements/create-from-recommendation` - Create supplement from recommendation

**Deliverables**:
- [ ] Recommendation algorithm
- [ ] Confidence scoring system
- [ ] Justification generator
- [ ] Recommendation API
- [ ] Recommendation UI component

---

### 7.4: Supplement Tracking & Analytics (1 day)

**Objective**: Track supplement success rates and continuously improve predictions.

**Features**:
- Track supplement submission → approval rate
- Compare predicted vs actual supplements
- ROI reporting (time saved, approval rate)
- Continuous learning (feedback loop)
- Shop-specific optimization

**Analytics Dashboard**:
```
Supplement Performance
├── Approval Rate: 92% (Target: >90%)
├── Average Cycle Time: 2.3 days (vs 4.5 industry avg)
├── Prediction Accuracy: 87%
├── Average Supplement Amount: $1,250
├── Total Supplement Revenue (YTD): $125,000
└── Time Saved: 150 hours (vs manual process)

Top Supplement Triggers
1. Frame damage (35% of supplements)
2. Hidden rust (22%)
3. Sensor replacement (18%)
4. Part availability (15%)
5. Other (10%)

Vehicle Types with Most Supplements
1. Pickup Trucks (F-150, Silverado) - 40%
2. SUVs (Suburban, Tahoe) - 30%
3. Luxury (BMW, Mercedes) - 20%
4. Other - 10%
```

**Continuous Learning**:
- When supplement approved: Increase pattern confidence
- When supplement rejected: Decrease pattern confidence
- Track shop-specific patterns
- Update recommendations based on feedback

**API Endpoints**:
- `GET /api/supplements/analytics/dashboard` - Analytics data
- `GET /api/supplements/analytics/roi` - ROI calculations
- `POST /api/supplements/feedback` - Submit feedback for learning

**Deliverables**:
- [ ] Analytics dashboard UI
- [ ] ROI calculator
- [ ] Feedback system
- [ ] Learning algorithm
- [ ] Pattern confidence updater

---

## Database Schema

```sql
-- Supplement patterns (from historical data)
CREATE TABLE supplement_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vehicle info
  vehicle_make VARCHAR(50),
  vehicle_model VARCHAR(50),
  vehicle_year INTEGER,

  -- Damage characteristics
  damage_location VARCHAR(100), -- "Front End", "Rear Quarter", etc.
  initial_damage_type VARCHAR(50), -- "Impact", "Scrape", "Dent", etc.
  initial_estimate_range VARCHAR(20), -- "$0-2K", "$2K-5K", "$5K+", etc.

  -- Supplement details
  supplement_trigger VARCHAR(200), -- "Hidden frame damage", "Rust perforation", etc.
  supplement_category VARCHAR(20), -- "labor", "parts", "paint", "other"

  -- Statistics
  frequency_count INTEGER DEFAULT 1,
  approval_count INTEGER DEFAULT 0,
  rejection_count INTEGER DEFAULT 0,
  avg_approval_rate DECIMAL(5, 2),
  avg_amount DECIMAL(10, 2),
  avg_days_to_approval DECIMAL(5, 2),

  -- Learning
  confidence_score DECIMAL(5, 2) DEFAULT 50.0, -- 0-100
  last_seen_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplement recommendations (tracking predictions)
CREATE TABLE supplement_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,

  -- Recommendation details
  trigger VARCHAR(200) NOT NULL,
  category VARCHAR(20) NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL, -- 0-100
  suggested_amount DECIMAL(10, 2),
  justification TEXT,
  documentation_needed TEXT[],

  -- Pattern references
  related_patterns JSONB, -- Array of pattern IDs that contributed

  -- Outcome tracking
  was_accepted BOOLEAN,
  was_submitted BOOLEAN,
  was_approved BOOLEAN,
  actual_amount DECIMAL(10, 2),

  -- Feedback loop
  feedback TEXT,
  accuracy_score DECIMAL(5, 2), -- How close was the prediction?

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_supplement_patterns_vehicle ON supplement_patterns(vehicle_make, vehicle_model, vehicle_year);
CREATE INDEX idx_supplement_patterns_damage ON supplement_patterns(damage_location, initial_damage_type);
CREATE INDEX idx_supplement_patterns_confidence ON supplement_patterns(confidence_score DESC);
CREATE INDEX idx_supplement_recommendations_estimate ON supplement_recommendations(estimate_id);
CREATE INDEX idx_supplement_recommendations_shop ON supplement_recommendations(shop_id);

-- RLS Policies
ALTER TABLE supplement_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patterns are public" ON supplement_patterns FOR SELECT USING (true);

CREATE POLICY "Users can view their shop's recommendations"
  ON supplement_recommendations FOR SELECT
  USING (shop_id IN (
    SELECT id FROM shops WHERE id = auth.uid()::uuid
    OR id IN (SELECT shop_id FROM shop_users WHERE user_id = auth.uid())
  ));

CREATE POLICY "Users can create recommendations for their shop"
  ON supplement_recommendations FOR INSERT
  WITH CHECK (shop_id IN (
    SELECT id FROM shops WHERE id = auth.uid()::uuid
    OR id IN (SELECT shop_id FROM shop_users WHERE user_id = auth.uid())
  ));
```

---

## Implementation Order

### Day 1: Historical Analysis Foundation
1. Create database tables (patterns, recommendations)
2. Build pattern extraction algorithm
3. Create pattern analysis API
4. Run initial pattern extraction on existing data

### Day 2: Pattern Recognition
1. Build confidence scoring algorithm
2. Create pattern matching engine
3. Build analytics dashboard
4. Test pattern accuracy

### Day 3: Pre-Disassembly System
1. Build trigger condition engine
2. Create suggestion generator
3. Build pre-disassembly UI component
4. Create documentation checklist

### Day 4: Real-Time Recommendations
1. Build recommendation engine
2. Create justification generator
3. Build recommendation UI
4. Integrate with estimate detail page

### Day 5: Analytics & Learning
1. Build analytics dashboard
2. Create ROI calculator
3. Implement feedback system
4. Build continuous learning algorithm

### Day 6: Testing & Polish
1. End-to-end testing
2. UI polish
3. Documentation
4. Demo data generation

---

## Success Metrics

**Technical**:
- Pattern extraction processes 1000+ historical supplements
- Recommendation confidence >70% on average
- API response time <500ms
- Zero errors in pattern matching

**Business**:
- Supplement cycle time reduced by 50%
- Approval rate >90%
- Shop revenue from supplements increases 25%
- Time saved: 2-3 hours per supplement

**User Experience**:
- Suggestions appear in <2 seconds
- Clear justification text (ready to send)
- One-click supplement creation
- Mobile-responsive analytics

---

## Completion Criteria

- [x] Historical supplement patterns extracted
- [x] Pre-disassembly suggestions working
- [x] Real-time recommendations functional
- [x] Analytics dashboard built
- [x] Feedback loop implemented
- [x] ROI tracking active
- [x] All error cases handled
- [x] Documentation complete

---

## Files to Create

### Backend
- `src/lib/supplements/pattern-analyzer.ts` - Pattern extraction
- `src/lib/supplements/recommendation-engine.ts` - Recommendation logic
- `src/lib/supplements/confidence-scorer.ts` - Confidence calculations
- `src/lib/supplements/justification-generator.ts` - Text generation
- `src/app/api/supplements/patterns/route.ts` - Pattern API
- `src/app/api/supplements/recommendations/route.ts` - Recommendation API
- `src/app/api/supplements/analytics/route.ts` - Analytics API
- `src/app/api/supplements/feedback/route.ts` - Feedback API

### Frontend
- `src/components/supplements/SupplementSuggestions.tsx` - Suggestion cards
- `src/components/supplements/PreDisassemblyChecklist.tsx` - Checklist
- `src/components/supplements/RecommendationCard.tsx` - Single recommendation
- `src/components/supplements/AnalyticsDashboard.tsx` - Analytics UI
- `src/components/supplements/ROICalculator.tsx` - ROI display

### Database
- `migrations/phase-7/7.1-supplement-patterns.sql` - Pattern tables
- `migrations/phase-7/7.2-supplement-recommendations.sql` - Recommendation tables

### Scripts
- `scripts/extract-supplement-patterns.js` - Initial pattern extraction
- `scripts/update-pattern-confidence.js` - Scheduled confidence updates

---

**Phase 7 Start**: 2025-11-19
**Estimated Completion**: 2025-12-03 (2 weeks)
