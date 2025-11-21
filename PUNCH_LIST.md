# CollisionPro Development Punch List
## Step-by-Step Implementation Plan

**Goal:** Build market-ready product with all critical features
**Timeline:** 12 weeks to launch
**Pricing:** $750/month, full-featured

---

## ✅ SPRINT 1: CRITICAL FIXES (Week 1)

### Task 1.1: Remove 3D Vehicle Model
**Priority:** CRITICAL
**Time:** 2 days

- [ ] Delete `src/components/3d/models/ProfessionalVehicle.tsx`
- [ ] Delete `src/components/3d/models/ImprovedVehicle.tsx`
- [ ] Delete `src/components/3d/models/VehicleModel.tsx`
- [ ] Remove Three.js dependencies from package.json
- [ ] Remove @react-three/fiber and @react-three/drei
- [ ] Update estimate detail page to remove 3D viewer link
- [ ] Run build test

**Files to modify:**
- `src/app/dashboard/estimates/[id]/page.tsx` - Remove 3D viewer button
- `package.json` - Remove Three.js deps
- Run: `npm uninstall three @react-three/fiber @react-three/drei`

---

### Task 1.2: Create 2D Damage Diagrams
**Priority:** CRITICAL
**Time:** 3 days

- [ ] Create `src/components/diagrams/` directory
- [ ] Create SVG car diagrams:
  - [ ] `public/diagrams/sedan-front.svg`
  - [ ] `public/diagrams/sedan-rear.svg`
  - [ ] `public/diagrams/sedan-left.svg`
  - [ ] `public/diagrams/sedan-right.svg`
  - [ ] `public/diagrams/sedan-top.svg`
- [ ] Create `src/components/diagrams/VehicleDiagram2D.tsx` component
- [ ] Add clickable regions for damage marking
- [ ] Replace DamageAnnotator with new 2D system
- [ ] Migrate existing damage annotations
- [ ] Test damage marking workflow

**Database migration:**
```sql
-- No schema changes needed, damage markers still use x,y,z coords
-- Just interpret differently: x,y for 2D position, z for view (0=front, 1=rear, etc.)
```

---

### Task 1.3: Tax Calculation Engine
**Priority:** CRITICAL
**Time:** 2 days

- [ ] Sign up for TaxJar API (or Avalara)
- [ ] Add environment variables for tax API
- [ ] Create `src/lib/tax.ts` utility
- [ ] Add tax fields to Estimate schema:
  ```sql
  ALTER TABLE "Estimate" ADD COLUMN "subtotal" DECIMAL(10,2);
  ALTER TABLE "Estimate" ADD COLUMN "taxRate" DECIMAL(5,4);
  ALTER TABLE "Estimate" ADD COLUMN "taxAmount" DECIMAL(10,2);
  ALTER TABLE "Estimate" ADD COLUMN "shopSupplies" DECIMAL(10,2) DEFAULT 0;
  ALTER TABLE "Estimate" ADD COLUMN "environmentalFees" DECIMAL(10,2) DEFAULT 0;
  ALTER TABLE "Estimate" ADD COLUMN "grandTotal" DECIMAL(10,2);
  ```
- [ ] Update estimate calculation logic
- [ ] Add tax breakdown to estimate PDF
- [ ] Add tax configuration to shop settings
- [ ] Test with multiple states

**Files to create:**
- `src/lib/tax.ts`
- `src/app/api/tax/calculate/route.ts`
- `migrations/phase-4/4.1-tax-calculation.sql`

---

## ✅ SPRINT 2: PARTS ECOSYSTEM (Week 2-3)

### Task 2.1: Paint Material Calculator
**Priority:** HIGH
**Time:** 3 days

- [ ] Create paint codes database table
- [ ] Seed with common paint codes
- [ ] Create paint calculator UI component
- [ ] Add labor time calculations
- [ ] Add material cost calculations
- [ ] Support multi-stage paint (base/clear/pearl)
- [ ] Add to estimate workflow

**Database:**
```sql
CREATE TABLE "PaintCode" (
  "id" TEXT PRIMARY KEY,
  "year" INT NOT NULL,
  "make" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "colorName" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- solid, metallic, pearl, tri-coat
  "materialCostPerPanel" DECIMAL(10,2),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PaintEstimate" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL,
  "paintCodeId" TEXT,
  "panels" INT NOT NULL,
  "squareFeet" DECIMAL(10,2),
  "materialCost" DECIMAL(10,2),
  "laborHours" DECIMAL(10,2),
  "totalCost" DECIMAL(10,2),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Files to create:**
- `src/components/estimates/PaintCalculator.tsx`
- `src/app/api/paint/codes/route.ts`
- `src/app/api/paint/calculate/route.ts`
- `migrations/phase-4/4.2-paint-calculator.sql`

---

### Task 2.2: OEM Parts Integration
**Priority:** HIGH
**Time:** 5 days

- [ ] Research GM Parts API
- [ ] Research Ford Parts API
- [ ] Research Toyota/Lexus API
- [ ] Research Mopar API
- [ ] Research Honda/Acura API
- [ ] Update AftermarketPart schema:
  ```sql
  ALTER TABLE "AftermarketPart" ADD COLUMN "partType" TEXT DEFAULT 'aftermarket';
  -- Values: 'oem', 'aftermarket', 'used', 'remanufactured'
  ALTER TABLE "AftermarketPart" ADD COLUMN "oemPartNumber" TEXT;
  ALTER TABLE "AftermarketPart" ADD COLUMN "dealerPrice" DECIMAL(10,2);
  ALTER TABLE "AftermarketPart" ADD COLUMN "certifications" TEXT[]; -- CAPA, NSF, etc.
  ```
- [ ] Create OEM parts search API endpoints
- [ ] Add OEM vs Aftermarket comparison UI
- [ ] Show savings percentage
- [ ] Add to parts selection workflow

**Files to create:**
- `src/lib/oem-parts/` directory
  - `gm.ts`
  - `ford.ts`
  - `toyota.ts`
  - `mopar.ts`
  - `honda.ts`
- `src/app/api/parts/oem/route.ts`
- `migrations/phase-4/4.3-oem-parts.sql`

---

### Task 2.3: Real-Time Price Comparison
**Priority:** HIGH
**Time:** 4 days

- [ ] Integrate with multiple supplier APIs:
  - [ ] RockAuto (already done)
  - [ ] AutoZone API
  - [ ] O'Reilly API
  - [ ] NAPA API
  - [ ] LKQ (used parts)
- [ ] Create price aggregation service
- [ ] Build price comparison UI
- [ ] Show delivery times
- [ ] Highlight best value recommendation
- [ ] Cache prices (1 hour TTL)

**Files to create:**
- `src/lib/suppliers/` directory
  - `autozone.ts`
  - `oreilly.ts`
  - `napa.ts`
  - `lkq.ts`
- `src/components/parts/PriceComparison.tsx`
- `src/app/api/parts/compare/route.ts`

---

## ✅ SPRINT 3: WORKFLOW & OPERATIONS (Week 4-5)

### Task 3.1: Technician Management
**Priority:** MEDIUM
**Time:** 3 days

- [ ] Create Technician database schema
- [ ] Create tech management UI
- [ ] Add certifications tracking (I-CAR, ASE)
- [ ] Add specialty tracking
- [ ] Create tech assignment workflow
- [ ] Add time tracking (clock in/out)
- [ ] Build efficiency reports

**Database:**
```sql
CREATE TABLE "Technician" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "shopId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "certifications" TEXT[],
  "specialties" TEXT[],
  "hourlyRate" DECIMAL(10,2),
  "efficiency" DECIMAL(5,2) DEFAULT 1.0,
  "active" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "JobAssignment" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL,
  "technicianId" TEXT NOT NULL,
  "assignedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "startedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "estimatedHours" DECIMAL(10,2),
  "actualHours" DECIMAL(10,2),
  "status" TEXT DEFAULT 'assigned'
);
```

**Files to create:**
- `src/app/dashboard/technicians/page.tsx`
- `src/components/technicians/TechnicianList.tsx`
- `src/components/technicians/AssignmentModal.tsx`
- `src/app/api/technicians/route.ts`
- `migrations/phase-4/4.4-technicians.sql`

---

### Task 3.2: DRP Network Integration
**Priority:** MEDIUM
**Time:** 3 days

- [ ] Create DRP partner database
- [ ] Add DRP partner management UI
- [ ] Add DRP fields to estimates
- [ ] Create DRP notification workflow
- [ ] Track approval status
- [ ] Support special DRP pricing rules

**Database:**
```sql
CREATE TABLE "DRPPartner" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "laborRate" DECIMAL(10,2),
  "paintRate" DECIMAL(10,2),
  "agreementTerms" TEXT,
  "specialInstructions" TEXT,
  "active" BOOLEAN DEFAULT true
);

ALTER TABLE "Estimate" ADD COLUMN "drpPartnerId" TEXT;
ALTER TABLE "Estimate" ADD COLUMN "drpApprovalStatus" TEXT;
```

**Files to create:**
- `src/app/dashboard/drp-partners/page.tsx`
- `src/components/drp/PartnerList.tsx`
- `src/app/api/drp/route.ts`
- `migrations/phase-4/4.5-drp.sql`

---

## ✅ SPRINT 4: INTEGRATED ACCOUNTING (Week 6-8)

### Task 4.1: Core Accounting Foundation
**Priority:** HIGH
**Time:** 5 days

- [ ] Create Chart of Accounts schema
- [ ] Seed default accounts for collision shops
- [ ] Create Journal Entry schema
- [ ] Build account management UI
- [ ] Create journal entry UI
- [ ] Implement double-entry bookkeeping logic
- [ ] Build basic reports (P&L, Balance Sheet)

**Database:** (See PHASE_8_INTEGRATED_ACCOUNTING.md for full schema)

**Files to create:**
- `src/app/dashboard/accounting/page.tsx`
- `src/app/dashboard/accounting/chart-of-accounts/page.tsx`
- `src/app/dashboard/accounting/journal/page.tsx`
- `src/app/dashboard/accounting/reports/page.tsx`
- `src/components/accounting/` directory
- `src/lib/accounting/` directory
- `migrations/phase-8/8.1-accounting-foundation.sql`

---

### Task 4.2: Automatic Journal Entries
**Priority:** HIGH
**Time:** 3 days

- [ ] Auto-create entries when estimate is invoiced
- [ ] Auto-create entries when payment received
- [ ] Auto-create entries when parts ordered
- [ ] Auto-create entries when bill paid
- [ ] Add hooks to existing workflows
- [ ] Test all entry types

**Files to modify:**
- `src/app/api/estimates/[id]/route.ts`
- `src/app/api/payments/route.ts`
- `src/app/api/parts-orders/route.ts`

---

### Task 4.3: Bank Integration (Plaid)
**Priority:** MEDIUM
**Time:** 3 days

- [ ] Sign up for Plaid account
- [ ] Add Plaid SDK
- [ ] Create bank account connection UI
- [ ] Import transactions daily
- [ ] Build transaction categorization
- [ ] Create reconciliation workflow
- [ ] Add fraud detection alerts

**Files to create:**
- `src/lib/plaid.ts`
- `src/components/accounting/BankConnection.tsx`
- `src/components/accounting/Transactions.tsx`
- `src/app/api/banking/connect/route.ts`
- `src/app/api/banking/transactions/route.ts`

---

### Task 4.4: Bills & Payables
**Priority:** MEDIUM
**Time:** 2 days

- [ ] Create Bill schema
- [ ] Build bill entry UI
- [ ] Add bill payment workflow
- [ ] Track due dates
- [ ] Send payment reminders
- [ ] Generate AP aging report

**Files to create:**
- `src/app/dashboard/accounting/bills/page.tsx`
- `src/components/accounting/BillsList.tsx`
- `src/components/accounting/BillPayment.tsx`
- `src/app/api/accounting/bills/route.ts`

---

### Task 4.5: Tax Features
**Priority:** HIGH
**Time:** 3 days

- [ ] Create tax settings schema
- [ ] Build tax configuration UI
- [ ] Calculate quarterly tax estimates
- [ ] Generate tax reports
- [ ] Create Schedule C report
- [ ] Create depreciation tracker (Form 4562)
- [ ] Build tax deduction tracker

**Files to create:**
- `src/app/dashboard/accounting/tax/page.tsx`
- `src/components/accounting/TaxSettings.tsx`
- `src/components/accounting/QuarterlyEstimates.tsx`
- `src/lib/accounting/tax-calculations.ts`

---

## ✅ SPRINT 5: AI ASSISTANT (Week 9-10)

### Task 5.1: AI Assistant Foundation
**Priority:** HIGH
**Time:** 5 days

- [ ] Set up OpenAI API integration
- [ ] Create conversation database schema
- [ ] Build chat UI component
- [ ] Implement context management
- [ ] Add action parsing (create_estimate, search_parts, etc.)
- [ ] Create action executors
- [ ] Add authentication & permissions
- [ ] Test basic conversations

**Database:**
```sql
CREATE TABLE "AssistantConversation" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "shopId" TEXT,
  "messages" JSONB NOT NULL,
  "context" JSONB,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Files to create:**
- `src/components/ai/Assistant.tsx`
- `src/lib/ai/assistant.ts`
- `src/lib/ai/actions.ts`
- `src/app/api/ai/chat/route.ts`
- `migrations/phase-5/5.1-ai-assistant.sql`

---

### Task 5.2: AI Actions & Integrations
**Priority:** HIGH
**Time:** 3 days

- [ ] Implement "create estimate" action
- [ ] Implement "search parts" action
- [ ] Implement "generate report" action
- [ ] Implement "send notification" action
- [ ] Implement "order parts" action
- [ ] Implement "answer question" action
- [ ] Add data access helpers
- [ ] Test all actions

---

### Task 5.3: AI Tax Assistant
**Priority:** HIGH
**Time:** 2 days

- [ ] Create tax-specific prompts
- [ ] Add tax deduction finder
- [ ] Add quarterly estimate calculator
- [ ] Implement tax Q&A
- [ ] Add audit protection features
- [ ] Create year-end tax prep wizard

**Files to create:**
- `src/lib/ai/tax-assistant.ts`
- `src/components/ai/TaxAssistant.tsx`

---

## ✅ SPRINT 6: CUSTOMER PORTAL ENHANCEMENTS (Week 11)

### Task 6.1: Live Chat
**Priority:** MEDIUM
**Time:** 2 days

- [ ] Create messaging schema
- [ ] Build real-time chat UI
- [ ] Add WebSocket support (or Pusher)
- [ ] Create shop-side chat inbox
- [ ] Add notifications
- [ ] Support file attachments

**Database:**
```sql
CREATE TABLE "CustomerMessage" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderType" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "attachments" TEXT[],
  "read" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### Task 6.2: Video Updates
**Priority:** LOW
**Time:** 2 days

- [ ] Add video upload capability
- [ ] Create video player component
- [ ] Generate thumbnails
- [ ] Add to customer portal
- [ ] Add to estimate workflow

---

### Task 6.3: Digital Supplement Approval
**Priority:** MEDIUM
**Time:** 1 day

- [ ] Add digital signature capture
- [ ] Create approval workflow
- [ ] Send notifications
- [ ] Track approval history

---

## ✅ SPRINT 7: MOBILE & SECURITY (Week 12)

### Task 7.1: Progressive Web App
**Priority:** MEDIUM
**Time:** 2 days

- [ ] Add next-pwa plugin
- [ ] Create manifest.json
- [ ] Add service worker
- [ ] Test offline mode
- [ ] Add install prompt
- [ ] Test on iOS and Android

---

### Task 7.2: Two-Factor Authentication
**Priority:** HIGH
**Time:** 2 days

- [ ] Add 2FA schema
- [ ] Implement TOTP (Google Authenticator)
- [ ] Add SMS-based 2FA
- [ ] Create setup workflow
- [ ] Add backup codes
- [ ] Enforce for admin accounts

---

### Task 7.3: Audit Logs
**Priority:** MEDIUM
**Time:** 1 day

- [ ] Create audit log schema
- [ ] Add logging to critical actions
- [ ] Build audit log viewer
- [ ] Add export functionality

---

## 📋 ADDITIONAL TASKS (Ongoing)

### Marketing Website
- [ ] Update pricing page with $750/month
- [ ] Create feature comparison chart
- [ ] Build ROI calculator
- [ ] Add testimonials section
- [ ] Create demo video
- [ ] Write case studies

### Documentation
- [ ] User guide
- [ ] API documentation
- [ ] Video tutorials
- [ ] FAQ section
- [ ] Troubleshooting guide

### Testing
- [ ] Unit tests for critical functions
- [ ] Integration tests for workflows
- [ ] Load testing (100 concurrent users)
- [ ] Security testing
- [ ] Cross-browser testing

### Deployment
- [ ] Set up staging environment
- [ ] Configure production monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure backups
- [ ] Set up CDN for assets

---

## 🎯 LAUNCH CHECKLIST

### Week 12 Final Tasks:
- [ ] Complete all Sprint 1-7 tasks
- [ ] Fix all critical bugs
- [ ] Complete user documentation
- [ ] Set up customer support system
- [ ] Configure billing (Stripe subscriptions)
- [ ] Set up email marketing (Mailchimp)
- [ ] Launch marketing website
- [ ] Create demo account
- [ ] Prepare launch announcement
- [ ] Reach out to first 10 beta customers

### Launch Day:
- [ ] Send launch email to mailing list
- [ ] Post on social media
- [ ] Post in industry forums
- [ ] Reach out to industry influencers
- [ ] Monitor for issues
- [ ] Respond to customer inquiries
- [ ] Track signups

---

## 📊 SUCCESS METRICS

### Track Weekly:
- [ ] Number of signups
- [ ] Active users
- [ ] Estimates created
- [ ] Revenue generated
- [ ] Customer satisfaction (NPS)
- [ ] Feature usage analytics
- [ ] Support ticket volume
- [ ] Churn rate

### Monthly Goals:
- **Month 1:** 10 paying customers
- **Month 2:** 25 paying customers
- **Month 3:** 50 paying customers
- **Month 6:** 100 paying customers
- **Month 12:** 250 paying customers

---

## 🚨 BLOCKERS & DEPENDENCIES

### API Access Needed:
- [ ] TaxJar or Avalara API
- [ ] Plaid API
- [ ] OpenAI API
- [ ] GM Parts API
- [ ] Ford Parts API
- [ ] Toyota Parts API
- [ ] AutoZone API
- [ ] Stripe (already have)

### Third-Party Services:
- [ ] Supabase (already have)
- [ ] Vercel (already have)
- [ ] Domain name & DNS
- [ ] SSL certificate
- [ ] Email service (SendGrid/Postmark)
- [ ] SMS service (Twilio - already configured)

---

## 🎉 DONE CRITERIA

A task is "DONE" when:
- ✅ Code is written and tested
- ✅ UI is built and responsive
- ✅ Database migrations are created
- ✅ API endpoints are documented
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Code review complete
- ✅ Deployed to staging
- ✅ User documentation written
- ✅ Product owner approves

---

**Let's build this! 🚀**

**Start with Sprint 1, Task 1.1: Remove 3D Vehicle Model**
