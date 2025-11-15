# Database Setup Guide - CollisionPro

## Prerequisites
- Supabase account with project created
- Access to Supabase SQL Editor

## Step-by-Step Database Setup

### 1. Run Core Schemas (In Order)

Run these SQL files in the Supabase SQL Editor in this exact order:

#### Step 1: Parts Integration Schema
```bash
File: scripts/create-parts-schema.sql
```

This creates:
- `PartSupplier` table (6 suppliers pre-loaded)
- `Part` table (universal parts catalog)
- `PartCrossReference` table (OEM ↔ Aftermarket)
- `PartPrice` table (real-time pricing per supplier)
- Sample data: Honda Civic bumper with 9 price points

**To run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/create-parts-schema.sql`
3. Paste and click "Run"
4. Verify: You should see 6 suppliers and sample parts

---

#### Step 2: Purchase Order CRM Schema
```bash
File: scripts/create-orders-schema.sql
```

This creates:
- `PurchaseOrder` table (tracking orders per supplier)
- `OrderItem` table (line items in orders)
- `OrderStatusHistory` table (audit trail)
- Auto-generated order numbers (PO-YYYYMMDD-###)
- Trigger to auto-calculate totals

**To run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `scripts/create-orders-schema.sql`
3. Paste and click "Run"
4. Verify: Tables created successfully

---

#### Step 3: Scraper Logging Schema
```bash
File: scripts/create-scraper-schema.sql
```

This creates:
- `ScrapeLog` table (monitoring scraper runs)

**To run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy the SQL below:

```sql
CREATE TABLE "ScrapeLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,
  "supplierName" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "partsScraped" INTEGER NOT NULL DEFAULT 0,
  "partsAdded" INTEGER NOT NULL DEFAULT 0,
  "partsUpdated" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB DEFAULT '[]',
  "duration" INTEGER NOT NULL,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "ScrapeLog_supplierId_idx" ON "ScrapeLog"("supplierId");
CREATE INDEX "ScrapeLog_timestamp_idx" ON "ScrapeLog"("timestamp" DESC);
```

3. Paste and click "Run"
4. Verify: ScrapeLog table created

---

### 2. Verify Database Setup

Run this query in SQL Editor to verify all tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should see:
- ✅ Estimate
- ✅ EstimatePart
- ✅ OrderItem
- ✅ OrderStatusHistory
- ✅ Part
- ✅ PartCrossReference
- ✅ PartPrice
- ✅ PartSupplier
- ✅ PurchaseOrder
- ✅ ScrapeLog
- ✅ Shop
- ✅ User

---

### 3. Test Parts Data

Run this query to verify sample parts data:

```sql
SELECT
  p.partNumber,
  p.name,
  p.make,
  p.model,
  COUNT(pp.id) as price_count,
  MIN(pp.price) as lowest_price,
  MAX(pp.price) as highest_price
FROM "Part" p
LEFT JOIN "PartPrice" pp ON p.id = pp.partId
GROUP BY p.id, p.partNumber, p.name, p.make, p.model;
```

You should see Honda Civic parts with multiple price points.

---

## Next Steps

### Option A: Run Scrapers (Recommended for Production)

1. **Deploy scraper service to Railway:**
   - Create Railway project from GitHub repo
   - Set environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
   - Set start command: `npm run scrape:schedule`
   - Scrapers will run daily at noon CST

2. **Or test scrapers locally:**
   ```bash
   npm run scrape
   ```

### Option B: Manual Data Entry (For Testing)

If you want to test without scrapers, you can manually insert parts:

```sql
-- Insert a test part
INSERT INTO "Part" (
  "id", "partNumber", "name", "category", "make", "model",
  "yearStart", "yearEnd", "isOEM"
) VALUES (
  'part_test_001',
  'TEST-12345',
  'Front Bumper Cover',
  'Body Parts',
  'Honda',
  'Civic',
  2020,
  2023,
  false
);

-- Insert price from AutoZone
INSERT INTO "PartPrice" (
  "id", "partId", "supplierId", "price", "inStock",
  "leadTimeDays", "warranty", "productUrl"
) VALUES (
  'price_test_001',
  'part_test_001',
  'sup_autozone',
  149.99,
  true,
  1,
  '1 Year',
  'https://www.autozone.com/...'
);

-- Insert price from RockAuto
INSERT INTO "PartPrice" (
  "id", "partId", "supplierId", "price", "inStock",
  "leadTimeDays", "warranty", "productUrl"
) VALUES (
  'price_test_002',
  'part_test_001',
  'sup_rockauto',
  129.99,
  true,
  3,
  '90 Days',
  'https://www.rockauto.com/...'
);
```

---

## Testing the Full Workflow

### 1. Search for Parts
- Go to `/dashboard/parts`
- Search for "Honda Civic bumper"
- You should see parts with multiple supplier prices

### 2. Add to Cart
- Click "Add to Cart" on any part
- Navigate to `/dashboard/cart`
- You should see your cart with items

### 3. Optimize Cart
- Add multiple parts (3+)
- Click "Optimize Cart"
- See the optimized split across suppliers
- View savings calculation

### 4. Create Orders
- Fill in customer/vehicle info
- Click "Create X Purchase Orders"
- Orders are created in database
- Supplier tabs open automatically

### 5. Verify Orders in Database
```sql
SELECT
  po.orderNumber,
  po.status,
  ps.name as supplier,
  po.customerName,
  COUNT(oi.id) as item_count,
  po.total
FROM "PurchaseOrder" po
JOIN "PartSupplier" ps ON po.supplierId = ps.id
LEFT JOIN "OrderItem" oi ON po.id = oi.purchaseOrderId
GROUP BY po.id, po.orderNumber, po.status, ps.name, po.customerName, po.total
ORDER BY po.createdAt DESC;
```

---

## Troubleshooting

### Issue: Parts search returns no results
**Solution:** Run the sample data from `create-parts-schema.sql` or add test parts manually

### Issue: Optimization fails
**Solution:** Ensure parts have `weight` field populated and multiple prices from different suppliers

### Issue: Order creation fails
**Solution:** Check that:
- User is authenticated (session cookies set)
- User has a `shopId` in User table
- Supplier IDs match database records

### Issue: Scrapers fail on Railway
**Solution:**
- Check environment variables are set correctly
- Verify Puppeteer dependencies installed
- Check Railway logs for errors

---

## API Endpoints Reference

### Parts Search
```
GET /api/parts/search?q=bumper&make=Honda&model=Civic&year=2020
```

### Cart Optimization
```
POST /api/cart/optimize
Body: { items: [...], taxRate: 0.0825 }
```

### Create Purchase Order
```
POST /api/orders/create
Body: { supplierId, parts: [...], customerName, vehicleMake, ... }
```

---

## Production Checklist

Before going live:
- ✅ All database schemas executed
- ✅ Scrapers deployed to Railway (or API integrations set up)
- ✅ Environment variables configured on Vercel
- ✅ Test complete workflow end-to-end
- ✅ Verify order creation works
- ✅ Check cart optimization produces savings
- ✅ Test with real parts data

---

**You're ready to launch CollisionPro Phase 2: Parts Integration & Smart Cart Optimizer!**

This is the feature that saves shops thousands per month. Let's change the collision repair industry.
