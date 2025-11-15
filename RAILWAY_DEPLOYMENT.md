# Deploy Scrapers to Railway - Step by Step Guide

## What Railway Does

Railway is a platform for deploying long-running services (like our scrapers that run 24/7). Unlike Vercel (which is for web apps), Railway is perfect for background jobs that need to run continuously.

**Our use case:** Scrapers that run daily at noon CST to populate the parts database.

---

## Prerequisites

1. **GitHub account** with CollisionPro repo
2. **Railway account** (free to start)
3. **Environment variables** from Supabase

---

## Step 1: Create Railway Account

### 1.1 Sign Up
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub
4. Authorize Railway to access your GitHub repos

### 1.2 Pricing
**Hobby Plan (Free):**
- $5 free credits per month
- Good for testing
- Limited to 500 hours/month

**Developer Plan ($5/month):**
- $5 credits included + usage-based
- Better for production
- Recommended once scrapers are running

---

## Step 2: Create New Project

### 2.1 From GitHub
1. Click "New Project" in Railway dashboard
2. Select "Deploy from GitHub repo"
3. Find and select `collisionpro` repository
4. Railway will detect it's a Node.js project

### 2.2 Service Configuration
Railway will automatically:
- Detect `package.json`
- Install dependencies with `npm install`
- But we need to tell it what to run...

---

## Step 3: Configure Build & Start Commands

### 3.1 Add Railway Configuration File

Create this file in your project root:

**File:** `railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run scrape:schedule",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

This tells Railway:
- Install dependencies automatically
- Run `npm run scrape:schedule` to start the service
- Restart if it crashes

### 3.2 Commit and Push

```bash
git add railway.json
git commit -m "Add Railway deployment configuration"
git push origin master
```

Railway will auto-deploy when you push to GitHub!

---

## Step 4: Set Environment Variables

### 4.1 Get Your Supabase Credentials

From Supabase Dashboard → Settings → API:

1. **Project URL**: `https://YOUR_PROJECT.supabase.co`
2. **Service Role Key**: Click "Reveal" next to `service_role` key

### 4.2 Add to Railway

In Railway dashboard:

1. Click on your `collisionpro` service
2. Go to **Variables** tab
3. Click **+ New Variable**
4. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NODE_ENV=production
```

**IMPORTANT:** Use your **production** Supabase project URL and key!

### 4.3 Redeploy

After adding variables:
1. Go to **Deployments** tab
2. Click **Deploy** button
3. Railway will restart with new environment variables

---

## Step 5: Monitor Deployment

### 5.1 View Build Logs

In Railway dashboard:
1. Click **Deployments** tab
2. Click on the active deployment
3. View real-time logs

**Look for:**
```
✓ Dependencies installed
✓ Starting scraper service
✓ Scheduler initialized - scraping at 12:00 PM CST daily
```

### 5.2 Check for Errors

Common issues:
- Missing environment variables → Add them in Variables tab
- Puppeteer dependencies → Railway auto-installs for Node.js
- Module not found → Check package.json has all dependencies

---

## Step 6: Verify Scrapers Are Running

### 6.1 Check Logs in Railway

Look for output like:
```
[2025-01-14 12:00:00] Starting scheduled scrape...
[2025-01-14 12:00:05] Scraping AutoZone...
[2025-01-14 12:01:30] AutoZone: 1,245 parts scraped, 1,200 added, 45 updated
[2025-01-14 12:01:35] Scraping RockAuto...
```

### 6.2 Check Database in Supabase

Run this query in Supabase SQL Editor:

```sql
-- Check scraper logs
SELECT
  "supplierName",
  "success",
  "partsScraped",
  "partsAdded",
  "partsUpdated",
  "timestamp"
FROM "ScrapeLog"
ORDER BY "timestamp" DESC
LIMIT 10;

-- Check parts count
SELECT COUNT(*) as total_parts FROM "Part";

-- Check parts by supplier
SELECT
  ps.name as supplier,
  COUNT(DISTINCT pp.partId) as unique_parts
FROM "PartPrice" pp
JOIN "PartSupplier" ps ON pp.supplierId = ps.id
GROUP BY ps.name
ORDER BY unique_parts DESC;
```

**You should see:**
- ScrapeLog entries with timestamps
- Parts count increasing
- Multiple suppliers represented

---

## Step 7: Manual Test Run

Don't want to wait until noon? Trigger scrapers manually:

### 7.1 Add Manual Trigger Script

**File:** `scripts/manual-scrape.ts`
```typescript
import { ScraperScheduler } from '../src/lib/scrapers/ScraperScheduler';

async function runManualScrape() {
  console.log('Starting manual scrape...');

  const scheduler = new ScraperScheduler();
  await scheduler.runAllScrapers();

  console.log('Manual scrape complete!');
  process.exit(0);
}

runManualScrape();
```

### 7.2 Add NPM Script

In `package.json`, add:
```json
{
  "scripts": {
    "scrape": "tsx scripts/run-scrapers.ts",
    "scrape:schedule": "tsx scripts/run-scrapers.ts schedule",
    "scrape:manual": "tsx scripts/manual-scrape.ts"
  }
}
```

### 7.3 Run from Railway Console

In Railway dashboard:
1. Go to your service
2. Click **Settings** → **Deploy**
3. Temporarily change start command to: `npm run scrape:manual`
4. Redeploy
5. Watch logs for immediate scraping
6. Change back to `npm run scrape:schedule` when done

---

## Step 8: Scale Up (When Ready)

### 8.1 Current Setup
- 1 Railway service
- Runs all 6 scrapers sequentially
- Takes ~5-10 minutes total

### 8.2 Scaling Options

**Option A: Vertical Scaling (More Power)**
```
Railway Settings → Resources
- Increase CPU: 2 vCPU → 4 vCPU
- Increase RAM: 1GB → 2GB
Cost: ~$10-20/month
```

**Option B: Horizontal Scaling (Multiple Services)**

Deploy 3 separate services:

**Service 1: scrapers-1**
- AutoZone + RockAuto
- Start command: `tsx scripts/scrape-group-1.ts`

**Service 2: scrapers-2**
- O'Reilly + NAPA
- Start command: `tsx scripts/scrape-group-2.ts`

**Service 3: scrapers-3**
- LKQ + PartsGeek
- Start command: `tsx scripts/scrape-group-3.ts`

**Benefits:**
- Faster (parallel scraping)
- More resilient (one fails, others continue)
- Better resource utilization

**Cost:** ~$30/month for 3 services

---

## Step 9: Monitoring & Alerts

### 9.1 Railway Notifications

Enable email alerts:
1. Railway Settings → Notifications
2. Enable "Deployment Failed"
3. Enable "Service Crashed"

### 9.2 Custom Monitoring Script

**File:** `scripts/check-scraper-health.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkHealth() {
  // Check if scrapers ran in last 25 hours
  const { data: recentLogs } = await supabase
    .from('ScrapeLog')
    .select('*')
    .gte('timestamp', new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString());

  if (!recentLogs || recentLogs.length === 0) {
    console.error('⚠️ ALERT: No scraper runs in last 25 hours!');
    // Send email/SMS alert
  }

  // Check for failures
  const failures = recentLogs?.filter(log => !log.success);
  if (failures && failures.length > 0) {
    console.error(`⚠️ ALERT: ${failures.length} scraper failures detected`);
  }

  // Check parts count
  const { count } = await supabase
    .from('Part')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ Total parts in database: ${count}`);

  if (count! < 1000) {
    console.warn('⚠️ WARNING: Parts count below 1,000');
  }
}

checkHealth();
```

Run this daily with a cron job or Railway scheduled task.

---

## Troubleshooting

### Issue: Deployment Fails

**Check:**
1. Build logs for errors
2. All dependencies in package.json
3. Environment variables set correctly

**Fix:**
```bash
# Locally test the build
npm install
npm run scrape:manual

# If works locally, check Railway logs for specific error
```

### Issue: Scrapers Not Running

**Check:**
1. Railway service status (should be "Active")
2. Start command is correct: `npm run scrape:schedule`
3. Logs show "Scheduler initialized"

**Fix:**
- Redeploy service
- Check cron syntax in ScraperScheduler.ts

### Issue: No Parts Added to Database

**Check:**
1. Supabase credentials correct
2. Database schema created (run production-schema.sql)
3. Scraper logs show errors

**Fix:**
```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check if supplier records exist
SELECT * FROM "PartSupplier";
```

### Issue: High Memory Usage / Crashes

**Puppeteer uses a lot of RAM**

**Fix:**
```typescript
// In AutoZoneScraper.ts, add these args:
const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage', // Reduce memory usage
    '--disable-gpu',
  ]
});
```

Or upgrade Railway resources.

---

## Cost Estimates

### Hobby Tier (Free)
- $5 free credits/month
- ~500 hours compute
- Good for: Testing, small scraping jobs
- **Recommended for:** Initial setup and testing

### Developer Tier ($5/month + usage)
- Unlimited hours
- Pay for what you use
- **Estimated cost:** $10-15/month for 1 scraper service
- **Recommended for:** Production with moderate scraping

### Team Tier ($20/month + usage)
- Multiple services
- Better support
- **Estimated cost:** $30-40/month for 3 scraper services
- **Recommended for:** Production with aggressive scraping

---

## Expected Results

### After 1 Day:
- 6 scraper runs (one per supplier)
- ~2,000-5,000 parts in database
- ScrapeLog shows 6 entries

### After 1 Week:
- 42 scraper runs
- ~20,000-30,000 parts in database
- Multiple prices per part

### After 1 Month:
- 180 scraper runs
- ~100,000+ parts in database
- Comprehensive coverage across makes/models

---

## Next Steps After Railway Deployment

### 1. Verify Production Data
```sql
SELECT
  make,
  COUNT(*) as parts
FROM "Part"
GROUP BY make
ORDER BY parts DESC
LIMIT 10;
```

### 2. Test Parts Search in App
- Go to `/dashboard/parts`
- Search for "Honda bumper"
- See results from database

### 3. Test Cart Optimization
- Add parts to cart
- Click "Optimize Cart"
- Verify it shows prices from scraped data

### 4. Monitor Scraper Health
- Set up daily health check
- Review ScrapeLog for failures
- Adjust scraping frequency if needed

---

## Quick Reference Commands

```bash
# Commit Railway config
git add railway.json
git commit -m "Add Railway configuration"
git push origin master

# View Railway logs
# (Use Railway dashboard → Deployments → View Logs)

# Check database
# (Use Supabase SQL Editor with queries above)

# Manual test scrape
# (Change Railway start command to: npm run scrape:manual)
```

---

## Summary

**To deploy scrapers to Railway:**

1. ✅ Create Railway account (railway.app)
2. ✅ Connect GitHub repo
3. ✅ Add `railway.json` with start command
4. ✅ Set environment variables (Supabase URL + key)
5. ✅ Deploy and monitor logs
6. ✅ Verify parts appearing in database
7. ✅ Let it run daily at noon CST

**Timeline:**
- Setup: 30 minutes
- First scrape: 5-10 minutes
- Daily runs: Automatic
- To 100K parts: ~1 month

**Cost:**
- Start free ($5 credits)
- Production: ~$10-15/month

**You're now scraping and populating the largest collision parts database!**
