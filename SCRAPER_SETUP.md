# Parts Scraper Setup & Deployment

## What's Built

### ✅ Scraper Infrastructure
- **BaseScraper Class**: Smart deduplication, automatic upsert logic
- **AutoZone Scraper**: Puppeteer-based web scraper (template for others)
- **Scheduler**: Cron job for daily scraping at noon CST
- **Logging**: All scrape runs logged to `ScrapeLog` table

### ✅ Features
- **Deduplication**: Parts identified by hash (supplier + part number)
- **Smart Updates**: Only updates price/stock on subsequent runs
- **Error Handling**: Continues on errors, logs everything
- **Rate Limiting**: 5-second delay between scrapers

## Database Setup

Run this SQL in Supabase to create the scraper logging table:

```sql
-- Copy from scripts/create-scraper-schema.sql
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
```

## Local Testing

### Test Scrapers Once

```bash
npm run scrape
```

This runs all scrapers immediately. Great for testing!

### Start Scheduled Service

```bash
npm run scrape:schedule
```

Starts the cron job. Scrapers run daily at 12:00 PM CST.

## Railway Deployment

### Why Railway?
- Vercel is for the web app (serverless)
- Railway is for the scraper service (long-running process)
- Puppeteer needs a persistent server with Chrome

### Step 1: Create Railway Project

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `collisionpro` repository
4. Click "Deploy Now"

### Step 2: Configure Environment Variables

Add these to Railway:

```
NEXT_PUBLIC_SUPABASE_URL=https://pkyqrvrxwhlwkxalsbaz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
NODE_ENV=production
```

### Step 3: Configure Start Command

In Railway settings:

**Start Command**: `npm run scrape:schedule`

This keeps the scraper service running 24/7.

### Step 4: Deploy

Railway auto-deploys on push. Scrapers will run daily at noon CST.

## Adding More Scrapers

### Template for New Scraper

```typescript
// src/lib/scrapers/RockAutoScraper.ts
import { BaseScraper, ScrapedPart } from './BaseScraper';
import puppeteer from 'puppeteer';

export class RockAutoScraper extends BaseScraper {
  constructor() {
    super('sup_rockauto', 'RockAuto', 'ROCKAUTO');
  }

  async scrape(options: any = {}): Promise<ScrapedPart[]> {
    const parts: ScrapedPart[] = [];

    // Your scraping logic here
    // Use puppeteer to navigate and extract data
    // Return ScrapedPart[] array

    return parts;
  }
}
```

### Add to Scheduler

```typescript
// src/lib/scrapers/ScraperScheduler.ts
import { RockAutoScraper } from './RockAutoScraper';

this.scrapers = [
  new AutoZoneScraper(),
  new RockAutoScraper(), // Add here
];
```

## Scraper Data Extraction

Each scraper extracts:

### Required Fields
- `partNumber`: OEM or aftermarket part number
- `name`: Part description
- `price`: Current price
- `inStock`: Availability boolean
- `productUrl`: Link to product page

### Optional Fields
- `images[]`: Product photos
- `description`: Detailed description
- `listPrice`: MSRP (for discount calc)
- `oemPartNumber`: OEM cross-reference
- `legacyPartNumbers[]`: Old part numbers
- `interchangeablePartNumbers[]`: Compatible parts
- `compatibleVehicles[]`: "2020 Honda Civic", etc.
- `warranty`: Warranty terms
- `leadTimeDays`: Shipping time

## Monitoring

### Check Scrape Logs

Query the database:

```sql
SELECT
  "supplierName",
  "success",
  "partsScraped",
  "partsAdded",
  "partsUpdated",
  "duration",
  "timestamp"
FROM "ScrapeLog"
ORDER BY "timestamp" DESC
LIMIT 20;
```

### View Errors

```sql
SELECT
  "supplierName",
  "errors",
  "timestamp"
FROM "ScrapeLog"
WHERE "success" = false
ORDER BY "timestamp" DESC;
```

## Roadmap

### Phase 1 (Current)
- ✅ Base scraper infrastructure
- ✅ AutoZone scraper
- ✅ Deduplication & logging
- ✅ Cron scheduler

### Phase 2 (Next)
- ⏳ RockAuto scraper
- ⏳ O'Reilly scraper
- ⏳ NAPA scraper
- ⏳ LKQ scraper
- ⏳ PartsGeek scraper

### Phase 3 (Future)
- 📊 Scraper dashboard in UI
- 🔔 Alerts for scraper failures
- 📈 Price history tracking
- 🤖 ML-powered part matching

## Notes

- Scrapers run **sequentially** with 5s delays to avoid rate limiting
- Each run takes ~30-60 seconds per supplier
- Railway's free tier gives 500 hours/month (plenty for daily scrapes)
- Consider upgrading Railway if scraping more frequently

---

Ready to launch! Once you get API credentials, we can replace scrapers with direct API calls for even faster updates.
