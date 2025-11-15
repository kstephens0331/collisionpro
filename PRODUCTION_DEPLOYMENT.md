# CollisionPro Production Deployment Guide

## Production Setup - Do This Once

### 1. Run Production SQL Schema in Supabase

**File:** `scripts/production-schema.sql`

This creates:
- All database tables
- Indexes for performance
- Triggers for automatic calculations
- Functions for order numbers
- **6 suppliers ONLY** (no sample parts data)

**How to run:**
1. Go to your **production** Supabase project (https://supabase.com/dashboard)
2. Navigate to SQL Editor
3. Copy entire contents of `scripts/production-schema.sql`
4. Paste and click "Run"
5. Verify success: Should see 6 suppliers, 0 parts

**Verification query:**
```sql
SELECT COUNT(*) as suppliers FROM "PartSupplier";
SELECT COUNT(*) as parts FROM "Part";
SELECT COUNT(*) as prices FROM "PartPrice";
```

Expected: 6 suppliers, 0 parts, 0 prices

---

### 2. Configure Vercel Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**Required variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=production
```

**Where to find these:**
- Supabase Dashboard → Project Settings → API
- URL: Project URL
- Service Role Key: Click "Reveal" next to service_role key

**IMPORTANT:** Use your **production** Supabase project, not development!

---

### 3. Deploy to Vercel

Vercel auto-deploys from GitHub pushes:

```bash
git push origin master
```

Or manual deploy:
```bash
npx vercel --prod
```

**Build should complete successfully** with:
- ✅ All routes compiled
- ✅ No TypeScript errors
- ✅ No build errors

---

### 4. Populate Parts Database

You have 3 options to populate parts data:

#### Option A: Run Scrapers on Railway (Recommended)

1. Create Railway project from GitHub repo
2. Set environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
3. Set start command: `npm run scrape:schedule`
4. Deploy

Scrapers will run daily at noon CST and populate parts automatically.

#### Option B: Manual API Integration

If you have supplier API credentials:
1. Add API keys to PartSupplier table
2. Update scrapers to use API instead of web scraping
3. Run scrapers once: `npm run scrape`

#### Option C: Manual Data Entry (Not Recommended)

For testing only. Insert parts manually via SQL:

```sql
INSERT INTO "Part" (
  "id", "partNumber", "name", "category", "make", "model",
  "yearStart", "yearEnd", "weight", "isOEM"
) VALUES (
  'part_' || gen_random_uuid()::text,
  'PART-12345',
  'Front Bumper Cover',
  'Bumper Cover',
  'Honda',
  'Civic',
  2020,
  2024,
  12.5,
  false
);

INSERT INTO "PartPrice" (
  "id", "partId", "supplierId", "price", "inStock",
  "leadTimeDays", "warranty", "productUrl"
) VALUES (
  'price_' || gen_random_uuid()::text,
  'part_ID_from_above',
  'sup_autozone',
  149.99,
  true,
  1,
  '1 Year',
  'https://www.autozone.com/...'
);
```

---

## Post-Deployment Checklist

### Verify Deployment

1. **Visit production URL**
   - Homepage loads
   - Login works
   - Dashboard accessible

2. **Test Parts Search** (`/dashboard/parts`)
   - Search works (may return no results if parts not populated yet)
   - No console errors
   - UI renders correctly

3. **Test Cart** (`/dashboard/cart`)
   - Empty cart message shows
   - No errors

4. **Check Supabase Logs**
   - Supabase Dashboard → Logs
   - Look for any auth or database errors

### Monitor Performance

**Supabase:**
- Database connections
- Query performance
- Storage usage

**Vercel:**
- Function duration
- Error rate
- Build times

---

## Populating Production Data

### Initial Parts Setup

Once scrapers are running or you have API access:

**Expected timeline:**
- First scraper run: 30-60 seconds per supplier
- Total time: ~5 minutes for all 6 suppliers
- Parts populated: Varies by search parameters

**Verify data:**
```sql
-- Check parts added
SELECT
  make,
  model,
  COUNT(*) as part_count
FROM "Part"
GROUP BY make, model
ORDER BY part_count DESC;

-- Check pricing coverage
SELECT
  ps.name as supplier,
  COUNT(pp.id) as prices
FROM "PartSupplier" ps
LEFT JOIN "PartPrice" pp ON ps.id = pp.supplierId
GROUP BY ps.name
ORDER BY prices DESC;
```

---

## Production Workflow

### For End Users:

1. **Search Parts** → Find parts across all suppliers
2. **Add to Cart** → Add multiple parts
3. **Optimize Cart** → Algorithm finds cheapest supplier split
4. **Create Orders** → Bulk create purchase orders
5. **Track Orders** → (Coming in Phase 3)

### For Admins:

**Monitor scrapers:**
```sql
SELECT
  "supplierName",
  "success",
  "partsAdded",
  "partsUpdated",
  "timestamp"
FROM "ScrapeLog"
ORDER BY "timestamp" DESC
LIMIT 20;
```

**Check order volume:**
```sql
SELECT
  DATE("orderDate") as date,
  COUNT(*) as orders,
  SUM("total") as revenue
FROM "PurchaseOrder"
GROUP BY DATE("orderDate")
ORDER BY date DESC;
```

---

## Troubleshooting Production Issues

### Issue: Parts search returns no results

**Diagnosis:**
```sql
SELECT COUNT(*) FROM "Part";
```

**Fix:**
- If 0: Parts not populated yet. Run scrapers or add manually.
- If > 0: Check search filters (make, model, year)

### Issue: Cart optimization fails

**Diagnosis:**
- Check browser console for errors
- Verify parts have `weight` field
- Ensure multiple suppliers have prices

**Fix:**
```sql
-- Add weights to parts
UPDATE "Part" SET "weight" = 10.0 WHERE "weight" IS NULL;

-- Check price coverage
SELECT p.id, p.name, COUNT(pp.id) as price_count
FROM "Part" p
LEFT JOIN "PartPrice" pp ON p.id = pp.partId
GROUP BY p.id
HAVING COUNT(pp.id) < 2;
```

### Issue: Order creation fails

**Diagnosis:**
- Check Vercel logs for API errors
- Verify user has `shopId` in User table

**Fix:**
```sql
-- Check user setup
SELECT id, email, shopId FROM "User" WHERE shopId IS NULL;

-- Create shop if missing
INSERT INTO "Shop" (id, name) VALUES ('shop_default', 'Default Shop');

-- Assign users to shop
UPDATE "User" SET shopId = 'shop_default' WHERE shopId IS NULL;
```

### Issue: Vercel deployment fails

**Common causes:**
- TypeScript errors (check build logs)
- Missing environment variables
- Old Prisma cache (Vercel will clear after push)

**Fix:**
1. Check Vercel build logs
2. Verify all env vars set
3. Redeploy from Vercel dashboard

---

## Scaling Considerations

### When you have 1000+ parts:

**Database:**
- Add composite indexes for common queries
- Enable Supabase connection pooling
- Consider read replicas

**Scrapers:**
- Increase Railway dyno size
- Add rate limiting delays
- Implement incremental updates (only changed prices)

**Vercel:**
- Upgrade to Pro plan for more functions
- Enable ISR (Incremental Static Regeneration) for parts pages
- Add Redis caching for frequently searched parts

---

## Production Best Practices

### Security

- ✅ Service role key only in server-side code
- ✅ Row Level Security (RLS) enabled on Supabase tables
- ✅ User authentication required for all dashboard pages
- ✅ No API keys in frontend code

### Performance

- ✅ Parts search results limited to 50
- ✅ Indexes on all foreign keys
- ✅ Optimized queries (no N+1 problems)
- ✅ Cart persists in localStorage (no DB writes until checkout)

### Monitoring

**Set up alerts for:**
- Failed scraper runs (>3 failures in 24h)
- High error rate (>5% of API requests)
- Slow queries (>1s response time)
- Low parts coverage (<500 parts total)

---

## Next Phase: Advanced Features

Once production is stable and populated:

1. **Order Tracking UI** - Track order status and shipments
2. **Real-time inventory** - Live stock updates via APIs
3. **Price history** - Track price changes over time
4. **Estimates integration** - Link parts to repair estimates
5. **Email notifications** - Order confirmations and updates
6. **Advanced analytics** - Savings reports, supplier performance

---

## Success Metrics

Production deployment is successful when:

- ✅ Site is live and accessible
- ✅ Users can login and access dashboard
- ✅ Database has 500+ parts from multiple suppliers
- ✅ Cart optimization works and shows savings
- ✅ Orders are created successfully
- ✅ No critical errors in logs
- ✅ Page load time < 2s

**You're now running CollisionPro in production!**

Real shops can start saving thousands per month on parts ordering.
