# Labor Operations & Shop Settings Guide

## Overview

CollisionPro now includes a comprehensive labor operations system with industry-standard labor times and shop-specific labor rates. This system enables automatic calculation of labor hours and costs based on the type of work being performed.

## Features

### 1. Industry-Standard Labor Operations Database
- **50+ pre-loaded operations** covering all common collision repair tasks
- Categories:
  - **Body Work**: R&I, dent repair, panel replacement
  - **Paint & Refinish**: Full panel paint, blending, spot repair
  - **Mechanical**: Suspension, alignment, drivetrain
  - **Electrical**: Sensors, modules, wiring
  - **Glass**: Windshield, windows
  - **Frame & Structural**: Frame straightening, rail replacement
  - **Detail & Finishing**: Buffing, detailing, final inspection

- Each operation includes:
  - Code (e.g., "RB-001", "PT-003")
  - Operation name
  - **Standard hours** (industry average time to complete)
  - Difficulty level
  - Description

### 2. Shop-Specific Labor Rates
- Configure custom labor rates for your shop
- Different rates by category:
  - Body labor rate ($/hour)
  - Paint labor rate ($/hour)
  - Mechanical labor rate ($/hour)
  - Electrical labor rate ($/hour)
  - Glass labor rate ($/hour)
  - Detail labor rate ($/hour)
  - Frame labor rate ($/hour)
  - Diagnostic rate ($/hour)
  - Alignment rate ($/hour)

### 3. Paint Materials Rates
- Paint materials rate ($/hour of paint time)
- Clear coat rate ($/hour)

### 4. Fees & Tax Configuration
- Shop supplies rate (% of parts + labor)
- Hazmat fee
- Environmental fee
- Sales tax rate
- Tax application rules (parts, labor, paint)

### 5. Business Information
- Company name, address, contact info
- Tax ID, license number
- Used on estimates and invoices

## Database Schema

### LaborOperation Table
```sql
CREATE TABLE "LaborOperation" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "description" TEXT,
  "standardHours" DECIMAL(5,2) NOT NULL,
  "difficulty" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

### ShopSettings Table
```sql
CREATE TABLE "ShopSettings" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL UNIQUE REFERENCES "Shop"("id"),

  -- Labor Rates
  "bodyLaborRate" DECIMAL(8,2) DEFAULT 75.00,
  "paintLaborRate" DECIMAL(8,2) DEFAULT 85.00,
  "mechanicalLaborRate" DECIMAL(8,2) DEFAULT 95.00,
  "electricalLaborRate" DECIMAL(8,2) DEFAULT 100.00,
  "glassLaborRate" DECIMAL(8,2) DEFAULT 65.00,
  "detailLaborRate" DECIMAL(8,2) DEFAULT 50.00,
  "diagnosticRate" DECIMAL(8,2) DEFAULT 125.00,
  "frameRate" DECIMAL(8,2) DEFAULT 95.00,
  "alignmentRate" DECIMAL(8,2) DEFAULT 85.00,

  -- Paint Materials
  "paintMaterialsRate" DECIMAL(8,2) DEFAULT 45.00,
  "clearCoatRate" DECIMAL(8,2) DEFAULT 35.00,

  -- Fees & Tax
  "shopSuppliesRate" DECIMAL(5,4) DEFAULT 0.10,
  "hazmatFee" DECIMAL(8,2) DEFAULT 15.00,
  "environmentalFee" DECIMAL(8,2) DEFAULT 10.00,
  "defaultTaxRate" DECIMAL(5,4) DEFAULT 0.0825,
  "taxParts" BOOLEAN DEFAULT TRUE,
  "taxLabor" BOOLEAN DEFAULT FALSE,
  "taxPaint" BOOLEAN DEFAULT TRUE,

  -- Business Info
  "companyName" TEXT,
  "address" TEXT,
  "city" TEXT,
  "state" TEXT,
  "zip" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "taxId" TEXT,
  "licenseNumber" TEXT,

  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

## Setup Instructions

### Step 1: Run Database Migration

Run the SQL migration to create tables and seed operations:

```bash
# Option A: Run via Node.js script (RECOMMENDED)
node scripts/add-labor-operations.js

# Option B: Run SQL directly in Supabase SQL Editor
# Copy contents of supabase-labor-operations.sql
# Paste into Supabase > SQL Editor > New Query
# Run the query
```

### Step 2: Configure Shop Settings

1. Log into CollisionPro dashboard
2. Click **Account** dropdown > **Settings**
3. Configure your shop's labor rates:
   - **Labor Rates** tab: Set hourly rates for each category
   - **Fees & Tax** tab: Configure shop fees and tax rules
   - **Paint** tab: Set paint materials rates
   - **Business Info** tab: Enter company details for estimates
4. Click **Save Settings**

### Step 3: Create Estimates with Auto-Calculated Labor

When creating estimates, the system will:
1. Load industry-standard operations
2. Pre-fill standard hours for each operation
3. Allow dealer to customize hours if needed
4. Auto-calculate labor cost: `hours × labor rate`
5. Apply appropriate labor rate based on operation category

## API Endpoints

### GET /api/labor-operations
Fetch all industry-standard labor operations.

**Query params:**
- `category`: Filter by category (optional)
- `search`: Search operation name/description (optional)

**Response:**
```json
{
  "success": true,
  "operations": [
    {
      "id": "labor_rb_front_bumper",
      "code": "RB-001",
      "category": "body",
      "operation": "R&I Front Bumper Cover",
      "standardHours": 1.5,
      "difficulty": "easy",
      "description": "Remove and install front bumper cover"
    }
  ]
}
```

### GET /api/shop-settings?shopId=xxx
Fetch shop settings for a specific shop.

**Response:**
```json
{
  "success": true,
  "settings": {
    "id": "settings_123",
    "shopId": "shop_demo",
    "bodyLaborRate": 75.00,
    "paintLaborRate": 85.00,
    ...
  }
}
```

### PATCH /api/shop-settings
Update shop settings.

**Request:**
```json
{
  "shopId": "shop_demo",
  "bodyLaborRate": 80.00,
  "paintLaborRate": 90.00
}
```

## Sample Labor Operations

### Body Work
- **RB-001**: R&I Front Bumper Cover - 1.5 hours
- **RB-002**: R&I Rear Bumper Cover - 1.5 hours
- **RB-003**: R&I Front Fender - 2.0 hours
- **RB-004**: R&I Hood - 1.0 hours
- **RB-005**: R&I Front Door Shell - 2.5 hours
- **RB-009**: Replace Quarter Panel - 12.0 hours (cut & weld)
- **RP-001**: Repair Small Dent (<3") - 1.0 hours
- **RP-002**: Repair Medium Dent (3-6") - 2.0 hours

### Paint & Refinish
- **PT-001**: Paint Bumper Cover - 3.0 hours
- **PT-002**: Paint Fender - 3.5 hours
- **PT-003**: Paint Hood - 4.0 hours
- **PT-004**: Paint Door - 4.0 hours
- **PT-009**: Blend Adjacent Panel - 2.0 hours

### Mechanical
- **MC-001**: Wheel Alignment (4-Wheel) - 1.0 hours
- **MC-002**: R&I Front Suspension Component - 2.0 hours
- **MC-005**: R&I Radiator - 2.5 hours

### Electrical
- **EL-001**: R&I Headlight Assembly - 0.5 hours
- **EL-003**: R&I Side Mirror - 0.8 hours
- **EL-006**: R&I Camera (Backup/Surround) - 1.0 hours

### Frame & Structural
- **FR-001**: Frame Measurement & Setup - 1.5 hours
- **FR-002**: Frame Pull - Light - 3.0 hours
- **FR-003**: Frame Pull - Medium - 6.0 hours
- **FR-004**: Frame Pull - Heavy - 10.0 hours

## Calculation Examples

### Example 1: Front Bumper Replacement + Paint
**Operations:**
1. R&I Front Bumper Cover (RB-001): 1.5 hours × $75/hr body rate = $112.50
2. Paint Bumper Cover (PT-001): 3.0 hours × $85/hr paint rate = $255.00
3. Paint Materials: 3.0 hours × $45/hr = $135.00

**Labor subtotal**: $367.50
**Paint materials**: $135.00
**Total**: $502.50

### Example 2: Door Replacement + Paint + Blend
**Operations:**
1. R&I Front Door Shell (RB-005): 2.5 hours × $75/hr = $187.50
2. Paint Door (PT-004): 4.0 hours × $85/hr = $340.00
3. Blend Adjacent Panel (PT-009): 2.0 hours × $85/hr = $170.00
4. Paint Materials: 6.0 hours × $45/hr = $270.00

**Labor subtotal**: $697.50
**Paint materials**: $270.00
**Total**: $967.50

## Customization

Dealers can:
1. **Adjust standard hours** - Override industry standard if job requires more/less time
2. **Add custom operations** - Create shop-specific operations (future feature)
3. **Configure rates** - Set competitive labor rates for their market
4. **Apply fees** - Add shop supplies, hazmat, environmental fees

## Benefits

✅ **Consistency**: Industry-standard labor times ensure fair, competitive estimates
✅ **Speed**: Auto-calculation eliminates manual labor calculations
✅ **Accuracy**: Reduces human error in labor hour estimation
✅ **Profitability**: Ensures all labor is properly accounted for and priced
✅ **Transparency**: Customers see itemized labor breakdown
✅ **Customization**: Dealers control rates and can adjust hours as needed

## Next Steps

1. ✅ Database schema created
2. ✅ Shop settings UI built
3. ✅ Labor operations seeded
4. 🚧 Integrate into estimate creation flow (IN PROGRESS)
5. 🚧 Add labor operation selector to estimate detail page
6. 🚧 Auto-calculate labor costs on estimates
7. 📋 PDF generation with labor breakdown
8. 📋 Email delivery system

---

**Built for CollisionPro** - Competing with Mitchell International, CCC ONE, and Audatex
