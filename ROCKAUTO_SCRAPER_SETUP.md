# RockAuto Parts Scraper Setup Guide

## Overview
The RockAuto scraper allows you to populate your parts inventory with real automotive parts data from RockAuto.com. This provides a proof-of-concept for showing collision shops how CollisionPro can access industry-standard parts pricing.

## Prerequisites
- Node.js installed
- CollisionPro database running (Supabase)
- All environment variables configured in `.env`

## Files Involved

### 1. Scraper Script
- **Location:** `scripts/rockauto-scraper.js`
- **Purpose:** Scrapes parts data from RockAuto.com
- **Features:**
  - Fetches parts by vehicle make/model/year
  - Extracts part numbers, prices, descriptions
  - Handles pagination and rate limiting
  - Saves data to database

### 2. Demo Scraper
- **Location:** `scripts/demo-rockauto-scraper.js`
- **Purpose:** Quick demo to test scraping without database
- **Output:** Console logs and JSON file

## Step-by-Step Setup

### Step 1: Verify Environment Variables
Make sure `.env` contains:
```bash
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 2: Run Demo Scraper (Test Only)
This tests the scraper without saving to database:

```bash
npm run scrape:demo
```

**What it does:**
- Scrapes parts for a sample vehicle (e.g., 2020 Toyota Camry)
- Outputs parts data to console
- Saves to `rockauto-parts-demo.json`

**Expected output:**
```
🔍 RockAuto Parts Scraper - Demo Mode
==========================================
Vehicle: 2020 Toyota Camry
Category: Body Parts

Found 25 parts:
  - Front Bumper Cover (Toyota OEM) - $450.99
  - Hood (Certified) - $325.50
  - Fender (Driver Side) - $189.99
  ...

✅ Demo complete! Parts saved to rockauto-parts-demo.json
```

### Step 3: Run Database Migration
Create the AftermarketPart table if you haven't already:

```bash
node scripts/run-phase9-migration.js
```

This creates the Parts Catalog tables including:
- `VehicleMake`
- `VehicleModel`
- `OEMPart`
- `AftermarketPart`
- `PartsCrossReference`

### Step 4: Run Production Scraper
This saves parts directly to your database:

```bash
npm run scrape
```

**What it does:**
- Scrapes parts for configured vehicles
- Saves to `AftermarketPart` table in Supabase
- Links to `VehicleModel` records
- Handles duplicates and updates existing parts

**Example output:**
```
🚀 RockAuto Parts Scraper - Production Mode
==========================================

Processing: 2020 Toyota Camry
  Category: Body Parts
    ✓ Saved: Front Bumper Cover - $450.99
    ✓ Saved: Hood - $325.50
    ✓ Updated: Fender (Driver Side) - $189.99 (was $199.99)

  Category: Mechanical
    ✓ Saved: Alternator - $125.00
    ✓ Saved: Starter Motor - $95.50

Total parts scraped: 147
Total saved to database: 145
Total updated: 2

✅ Scraping complete!
```

### Step 5: Configure Scraping Targets

Edit `scripts/rockauto-scraper.js` to customize which vehicles to scrape:

```javascript
// Configure vehicles to scrape
const vehicles = [
  { year: 2020, make: 'Toyota', model: 'Camry' },
  { year: 2021, make: 'Honda', model: 'Accord' },
  { year: 2019, make: 'Ford', model: 'F-150' },
  // Add more vehicles...
];

// Configure categories to scrape
const categories = [
  'Body Parts',
  'Mechanical',
  'Electrical',
  'Interior',
  // Add more categories...
];
```

### Step 6: Schedule Regular Scraping (Optional)

For production, you can schedule regular scraping using cron or a task scheduler:

**Linux/Mac (crontab):**
```bash
# Run scraper daily at 2 AM
0 2 * * * cd /path/to/collisionpro && npm run scrape >> logs/scraper.log 2>&1
```

**Windows (Task Scheduler):**
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
5. Program: `npm`
6. Arguments: `run scrape`
7. Start in: `C:\path\to\collisionpro`

## NPM Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "scrape": "node scripts/rockauto-scraper.js",
    "scrape:demo": "node scripts/demo-rockauto-scraper.js"
  }
}
```

## Rate Limiting & Best Practices

### Respect RockAuto's Servers
- **Delay between requests:** 2-5 seconds minimum
- **Max pages per session:** 100
- **Daily limit:** 1000 parts recommended
- **User agent:** Use a proper browser user-agent

### Error Handling
The scraper includes:
- ✓ Retry logic for failed requests (3 attempts)
- ✓ Rate limiting with exponential backoff
- ✓ Network timeout handling (30s)
- ✓ HTML parsing error recovery
- ✓ Database transaction rollback on errors

### Legal Compliance
⚠️ **Important:** Web scraping may violate Terms of Service. Consider:
1. **API First:** Check if RockAuto offers an official API
2. **Partnership:** Contact RockAuto about data licensing
3. **Alternative Data Sources:** Use aftermarket data providers like:
   - **Keystone Automotive** - Official parts distributor
   - **LKQ Corporation** - Recycled & aftermarket parts
   - **PartsTrader** - Parts marketplace API
   - **Mitchell 1** - Automotive repair data

## Troubleshooting

### Error: "Cannot find module 'cheerio'"
```bash
npm install cheerio axios
```

### Error: "Table 'AftermarketPart' does not exist"
Run the Phase 9 migration:
```bash
node scripts/run-phase9-migration.js
```

### Error: "Rate limit exceeded"
The scraper is making requests too fast. Increase the delay in `rockauto-scraper.js`:
```javascript
const DELAY_BETWEEN_REQUESTS = 5000; // 5 seconds
```

### Error: "CAPTCHA detected"
RockAuto has detected automated scraping. Options:
1. Reduce scraping frequency
2. Use rotating proxies
3. Consider official data partnerships instead

### Parts not appearing in estimate builder
Check that:
1. Parts were saved successfully: `SELECT COUNT(*) FROM "AftermarketPart"`
2. Vehicle models exist: `SELECT * FROM "VehicleModel"`
3. Parts are linked to correct model: Check `modelId` foreign key

## Database Queries

### View scraped parts:
```sql
SELECT
  p."partNumber",
  p."partName",
  p."price",
  p."supplier",
  m."year" || ' ' || mk."name" || ' ' || m."model" AS vehicle
FROM "AftermarketPart" p
LEFT JOIN "VehicleModel" m ON p."modelId" = m."id"
LEFT JOIN "VehicleMake" mk ON m."makeId" = mk."id"
ORDER BY p."createdAt" DESC
LIMIT 50;
```

### Count parts by supplier:
```sql
SELECT
  "supplier",
  COUNT(*) as count,
  AVG("price")::NUMERIC(10,2) as avg_price
FROM "AftermarketPart"
GROUP BY "supplier"
ORDER BY count DESC;
```

### Find parts for specific vehicle:
```sql
SELECT p.*
FROM "AftermarketPart" p
JOIN "VehicleModel" m ON p."modelId" = m."id"
JOIN "VehicleMake" mk ON m."makeId" = mk."id"
WHERE mk."name" = 'Toyota'
  AND m."model" = 'Camry'
  AND m."year" = 2020
ORDER BY p."partName";
```

## Alternative: Manual Parts Data Entry

If scraping isn't viable, you can manually add parts via the dashboard:

1. Go to `/dashboard/parts`
2. Click "Add Part"
3. Fill in:
   - Part Number
   - Description
   - Price
   - Supplier
   - Vehicle compatibility
4. Save

Or use the bulk import feature:
1. Prepare CSV file with columns: `partNumber,partName,price,supplier,year,make,model`
2. Go to `/dashboard/parts/import`
3. Upload CSV
4. Review and confirm

## Production Recommendations

For a production collision shop management system:

### Option 1: Parts Data Providers (Recommended)
- **Mitchell 1:** Industry-standard automotive repair data
  - Cost: $500-2000/month
  - Includes: Labor times, diagrams, OEM parts
  - API: RESTful with excellent documentation

- **PartsTrader:** Real-time parts pricing
  - Cost: Free for shops (commission-based)
  - Includes: Live quotes from suppliers
  - Integration: Full API available

- **Keystone Automotive:** Aftermarket parts distributor
  - Cost: Negotiated pricing
  - Includes: Wholesale pricing, fast shipping
  - B2B Portal: Yes

### Option 2: Insurance DRP Programs
Major insurance carriers (GEICO, Progressive, State Farm) provide:
- Direct parts pricing feeds
- Automated estimating integration
- No additional cost for DRP shops

### Option 3: Build Your Own Database
- Partner with local parts suppliers
- Negotiate data-sharing agreements
- Import their catalogs via CSV/API
- Update weekly/monthly

## Next Steps

1. **Test the demo scraper** to verify it works
2. **Run database migration** to create tables
3. **Scrape sample data** for 5-10 popular vehicles
4. **Build estimate** using scraped parts
5. **Show to potential customers** as proof of concept
6. **Evaluate long-term data strategy** (API vs scraping vs manual)

## Questions?

If you encounter issues:
1. Check the browser console for errors
2. Review logs in `logs/scraper.log`
3. Verify database connection with: `npm run db:test`
4. Check that environment variables are loaded

---

**Built with Claude Code** for CollisionPro
Competing with Mitchell International, CCC ONE, and Audatex
