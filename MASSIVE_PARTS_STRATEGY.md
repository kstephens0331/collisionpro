# Building the Largest Collision Parts Database

## Goal: Comprehensive Professional Parts Catalog

**Target:** 100,000+ parts covering:
- All major vehicle makes (30+)
- Model years 2010-2025
- OEM + multiple aftermarket brands per part
- Body panels, lights, mechanical, electrical, glass

**Professional Suppliers Only:**
- ✅ AutoZone (NEW parts only)
- ✅ RockAuto (NEW parts only)
- ✅ O'Reilly (NEW parts only)
- ✅ NAPA (NEW parts only)
- ✅ LKQ (NEW parts only - exclude recycled inventory)
- ✅ PartsGeek (NEW parts only)
- ❌ eBay (excluded - unreliable pricing)
- ❌ Pick-a-Part / junkyards (excluded - used parts)
- ❌ Used/Recycled/Refurbished parts (excluded - new only)

**Quality Standards:**
- OEM (Original Equipment Manufacturer) parts
- Certified Aftermarket (CAPA, NSF, etc.)
- New condition only
- Factory warranty included

---

## Scraping Strategy

### Phase 1: Core Collision Parts (Week 1)

**Priority parts** (highest demand in collision repair):

**Body Panels:**
- Front/Rear Bumper Covers
- Fenders
- Hoods
- Doors
- Quarter Panels
- Trunk Lids
- Rocker Panels
- Grilles

**Lighting:**
- Headlights
- Tail Lights
- Fog Lights
- Turn Signals
- Side Markers

**Glass:**
- Windshields
- Door Glass
- Quarter Glass
- Back Glass

**Target:** 20,000 parts

### Phase 2: Mechanical & Structural (Week 2)

**Mechanical:**
- Radiators
- AC Condensers
- Cooling Fans
- Bumper Reinforcements
- Crash Bars

**Suspension:**
- Control Arms
- Struts / Shocks
- Tie Rod Ends
- Ball Joints

**Electrical:**
- Wiring Harnesses
- Sensors
- Modules

**Target:** 30,000 parts (50,000 total)

### Phase 3: Accessories & Trim (Week 3)

**Trim:**
- Mirror Assemblies
- Door Handles
- Moldings
- Emblems
- Spoilers

**Interior (collision-related):**
- Airbags
- Seat Belts
- Steering Wheels
- Instrument Clusters

**Target:** 25,000 parts (75,000 total)

### Phase 4: Deep Coverage (Ongoing)

- Older model years (2000-2009)
- Commercial vehicles
- Luxury brands
- Rare/specialty parts

**Target:** 100,000+ parts

---

## Scraper Implementation

### Enhanced AutoZone Scraper

```typescript
// Comprehensive search queries
const searchQueries = [
  // Body
  'bumper cover', 'fender', 'hood', 'door', 'quarter panel',
  'trunk lid', 'hatch', 'grille', 'rocker panel',

  // Lights
  'headlight', 'tail light', 'fog light', 'turn signal',
  'marker light', 'backup light',

  // Glass
  'windshield', 'door glass', 'quarter glass', 'back glass',

  // Mechanical
  'radiator', 'condenser', 'fan assembly', 'bumper reinforcement',

  // Suspension
  'control arm', 'strut', 'shock', 'tie rod', 'ball joint',

  // Mirrors & Trim
  'mirror', 'door handle', 'molding', 'emblem'
];

const makes = [
  'Honda', 'Toyota', 'Ford', 'Chevrolet', 'Nissan',
  'Hyundai', 'Kia', 'Jeep', 'Ram', 'GMC',
  'Dodge', 'Mazda', 'Subaru', 'Volkswagen', 'BMW',
  'Mercedes-Benz', 'Audi', 'Lexus', 'Infiniti', 'Acura',
  'Cadillac', 'Buick', 'Chrysler', 'Tesla', 'Volvo'
];

const years = Array.from({length: 16}, (_, i) => 2010 + i); // 2010-2025

// Generate all combinations
for (const make of makes) {
  for (const year of years) {
    for (const query of searchQueries) {
      await scrape({ make, year, query });
      await delay(2000); // Rate limiting
    }
  }
}
```

### Multi-Supplier Coverage

**Each part should have 4-6 supplier prices for optimal optimization**

**Coverage targets per supplier:**
- AutoZone: 80,000 parts (widest selection)
- RockAuto: 90,000 parts (deepest catalog)
- O'Reilly: 70,000 parts (OEM heavy)
- NAPA: 60,000 parts (premium aftermarket)
- LKQ: 50,000 parts (recycled + new)
- PartsGeek: 75,000 parts (discount pricing)

---

## Technical Implementation

### Database Optimization for Scale

**Partitioning strategy:**
```sql
-- Partition Part table by make for faster queries
CREATE TABLE "Part_Honda" PARTITION OF "Part" FOR VALUES IN ('Honda');
CREATE TABLE "Part_Toyota" PARTITION OF "Part" FOR VALUES IN ('Toyota');
-- ... etc for all makes

-- Index optimization
CREATE INDEX CONCURRENTLY "idx_part_search" ON "Part"
  USING GIN (to_tsvector('english', name || ' ' || description));

-- Materialized view for fast search
CREATE MATERIALIZED VIEW "PartSearchIndex" AS
SELECT
  p.id,
  p.name,
  p.make,
  p.model,
  p.yearStart,
  p.yearEnd,
  MIN(pp.price) as lowest_price,
  COUNT(DISTINCT pp.supplierId) as supplier_count,
  array_agg(DISTINCT ps.name) as suppliers
FROM "Part" p
LEFT JOIN "PartPrice" pp ON p.id = pp.partId
LEFT JOIN "PartSupplier" ps ON pp.supplierId = ps.id
GROUP BY p.id;

CREATE INDEX ON "PartSearchIndex" (make, model);
CREATE INDEX ON "PartSearchIndex" USING gin(suppliers);
```

### Scraper Architecture

**Distributed scraping on Railway:**

```
Railway Service 1: AutoZone + RockAuto
Railway Service 2: O'Reilly + NAPA
Railway Service 3: LKQ + PartsGeek
```

**Each service:**
- 2GB RAM minimum
- Runs 24/7
- Scrapes continuously with delays
- Reports progress to ScrapeLog

**Rate limiting:**
- 1 request per 2 seconds per supplier
- Max 30 requests per minute
- Exponential backoff on errors
- Rotate user agents

### Deduplication Strategy

**Parts are deduplicated by:**
```typescript
function generatePartHash(part: ScrapedPart): string {
  // Normalize part number (remove spaces, dashes, uppercase)
  const normalized = part.partNumber
    .toUpperCase()
    .replace(/[\s\-]/g, '');

  return crypto
    .createHash('md5')
    .update(`${part.make}-${part.model}-${normalized}`)
    .digest('hex');
}
```

**Cross-reference strategy:**
```sql
-- After scraping, build cross-references
INSERT INTO "PartCrossReference" (id, oemPartId, aftermarketPartId)
SELECT
  gen_random_uuid()::text,
  oem.id,
  aft.id
FROM "Part" oem
JOIN "Part" aft ON aft.oemPartNumber = oem.partNumber
WHERE oem.isOEM = true AND aft.isOEM = false;
```

---

## API Integration (Better than Scraping)

### Supplier APIs to Pursue

**AutoZone:**
- Contact: business development team
- API access requires partnership agreement
- Real-time inventory and pricing

**RockAuto:**
- No public API currently
- Requires business relationship
- CSV/XML data feeds available

**O'Reilly:**
- Partner API available
- Requires TecDoc or ACES/PIES standards
- Real-time pricing

**NAPA:**
- TecDoc certified API
- Requires vendor agreement
- Inventory feeds available

**LKQ:**
- Wholesale portal API
- Requires shop credentials
- NEW parts only - filter out recycled inventory
- Focus on LKQ's new OEM and aftermarket lines

**PartsGeek:**
- Affiliate API available
- Product feeds via API
- Commission-based pricing

### API Benefits vs Scraping

**Scraping:**
- ❌ Slower (rate limited)
- ❌ Can break when sites change
- ❌ Missing detailed specs
- ✅ No contracts required
- ✅ Start immediately

**API:**
- ✅ Fast (100+ parts/second)
- ✅ Stable contracts
- ✅ Complete product data
- ✅ Real-time inventory
- ❌ Requires business agreements
- ❌ Setup time (weeks/months)

**Strategy:** Start with scraping, migrate to APIs as you get partnerships.

---

## Data Quality Standards

### Required Fields for All Parts

**Minimum data:**
- Part number (required)
- Part name (required)
- Category (required)
- Make, Model, Year range (required)
- At least 1 supplier price (required)
- Weight (required for optimization)

**Enhanced data:**
- OEM part number (for cross-reference)
- Multiple images (at least 3)
- Detailed description
- Specifications (dimensions, material, finish)
- Warranty information
- Fitment notes

### Quality Checks

**Automated validation:**
```sql
-- Parts without prices (needs cleanup)
SELECT * FROM "Part" p
LEFT JOIN "PartPrice" pp ON p.id = pp.partId
WHERE pp.id IS NULL;

-- Parts with only 1 supplier (needs more coverage)
SELECT p.*, COUNT(pp.id) as price_count
FROM "Part" p
JOIN "PartPrice" pp ON p.id = pp.partId
GROUP BY p.id
HAVING COUNT(pp.id) = 1;

-- Missing weights (breaks optimizer)
SELECT * FROM "Part" WHERE weight IS NULL;
```

**Quality score:**
```sql
ALTER TABLE "Part" ADD COLUMN "qualityScore" INTEGER DEFAULT 0;

-- Calculate quality score
UPDATE "Part" p SET "qualityScore" = (
  CASE WHEN weight IS NOT NULL THEN 10 ELSE 0 END +
  CASE WHEN images::text != '[]' THEN 15 ELSE 0 END +
  CASE WHEN description IS NOT NULL THEN 10 ELSE 0 END +
  CASE WHEN oemPartNumber IS NOT NULL THEN 15 ELSE 0 END +
  (SELECT COUNT(*) * 10 FROM "PartPrice" pp WHERE pp.partId = p.id)
);
```

---

## Monitoring & Reporting

### Scraper Dashboard

**Daily metrics:**
```sql
SELECT
  DATE(timestamp) as date,
  SUM(partsAdded) as new_parts,
  SUM(partsUpdated) as updated_parts,
  COUNT(*) as scraper_runs,
  AVG(duration) as avg_duration
FROM "ScrapeLog"
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

### Coverage Report

```sql
-- Parts by make
SELECT
  make,
  COUNT(*) as parts,
  AVG((SELECT COUNT(*) FROM "PartPrice" pp WHERE pp.partId = p.id)) as avg_suppliers
FROM "Part" p
GROUP BY make
ORDER BY parts DESC;

-- Parts by category
SELECT
  category,
  COUNT(*) as parts,
  MIN((SELECT MIN(price) FROM "PartPrice" pp WHERE pp.partId = p.id)) as lowest_price,
  MAX((SELECT MAX(price) FROM "PartPrice" pp WHERE pp.partId = p.id)) as highest_price
FROM "Part" p
GROUP BY category
ORDER BY parts DESC;
```

---

## Timeline to 100K+ Parts

**Week 1:**
- Deploy all 6 scrapers to Railway
- Scrape top 10 makes, 2010-2025, core body parts
- **Target: 20,000 parts**

**Week 2:**
- Expand to all 25 makes
- Add mechanical and lighting categories
- **Target: 50,000 parts**

**Week 3:**
- Add trim and accessory categories
- Fill gaps in coverage
- **Target: 75,000 parts**

**Week 4:**
- Older model years (2000-2009)
- Specialty vehicles
- Quality improvements
- **Target: 100,000+ parts**

**Ongoing:**
- Daily updates for price changes
- New model year additions
- API migrations as available

---

## Cost Estimates

### Railway Hosting (6 scrapers)

**Per service:**
- 2GB RAM, 2 vCPU
- $10/month per service
- **Total: $60/month** for scraping infrastructure

**Alternative: Single powerful instance**
- 8GB RAM, 4 vCPU
- Run all scrapers sequentially
- **$30/month**

### Supabase Database

**Pro Plan ($25/month):**
- 8GB database
- 100GB bandwidth
- Good for 100K-500K parts

**Team Plan ($599/month):**
- 30GB database
- 250GB bandwidth
- Required for 1M+ parts

**Start with Pro, upgrade as needed.**

---

## Success Metrics

**Comprehensive catalog defined as:**

- ✅ 100,000+ unique parts
- ✅ Coverage for top 25 makes
- ✅ Model years 2010-2025
- ✅ Average 4+ suppliers per part
- ✅ 95% of parts have weight data
- ✅ 80% of parts have images
- ✅ Daily price updates
- ✅ <1s search response time

**This will be the LARGEST collision parts database outside of the major estimating systems.**

Shops will have access to pricing that even dealerships don't have aggregated in one place.
