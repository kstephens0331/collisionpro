# Parts Integration Setup

## Database Setup Instructions

### Step 1: Run the SQL Schema in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/pkyqrvrxwhlwkxalsbaz
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `scripts/create-parts-schema.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

This will create:
- **6 database tables**: PartSupplier, Part, PartCrossReference, PartPrice, EstimatePart
- **Sample data**: 6 suppliers (LKQ, RockAuto, AutoZone, O'Reilly, NAPA, PartsGeek)
- **Demo parts**: 3 Honda Civic bumper parts with 9 price points

### Step 2: Test the API

After running the SQL, test the parts search API:

```bash
curl "https://collisionpro-mbjsgaf0i-kstephens0331s-projects.vercel.app/api/parts/search?make=Honda&model=Civic"
```

You should see JSON with 3 parts and their pricing from multiple suppliers.

### Step 3: Access the Parts Catalog

Visit: https://collisionpro-mbjsgaf0i-kstephens0331s-projects.vercel.app/dashboard/parts

Try searching for:
- "bumper"
- Make: "Honda", Model: "Civic"
- Year: "2022"

## Features Built

### Multi-Supplier Price Comparison
- Searches across all suppliers in real-time
- Sorts by price (lowest to highest)
- Shows availability, lead time, and warranty
- Highlights best price with green badge

### Smart Part Search
- Search by part name, number, or description
- Filter by make, model, year
- Cross-reference OEM to aftermarket equivalents

### Savings Calculator
- Shows potential savings between highest and lowest price
- Displays average price across all suppliers
- Tracks in-stock vs out-of-stock items

## Next Steps for API Integration

### Suppliers to Integrate (Research These)

1. **LKQ API** - https://www.lkqcorp.com/dealers
2. **RockAuto** - May need to scrape or use affiliate feed
3. **AutoZone** - https://www.autozone.com/b2b
4. **O'Reilly** - https://www.oreillyauto.com/business
5. **NAPA** - https://www.napaonline.com/en/business
6. **PartsGeek** - May have affiliate API

### What You Need from Each Supplier

- API endpoint URL
- API key / authentication credentials
- Part search endpoint
- Pricing endpoint
- Inventory availability endpoint
- Documentation

### Integration Pattern

Once you have API credentials, add them to `.env`:

```
LKQ_API_KEY=your_key_here
LKQ_API_ENDPOINT=https://api.lkq.com/v1
ROCKAUTO_API_KEY=your_key_here
```

Then we'll build API adapters in `src/lib/suppliers/` for each vendor.

## Current Status

✅ Database schema created
✅ Parts search API built
✅ UI with price comparison working
✅ Sample data loaded (Honda Civic demo)
⏳ Live supplier API integration (pending credentials)

You're now set up to aggregate parts pricing - the killer feature that will beat Mitchell/CCC!
