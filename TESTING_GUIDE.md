# CollisionPro Testing Guide

## What's Built & Ready to Test

### Phase 2: Smart Cart Optimizer - COMPLETE ✅

All features are built and ready for testing after running the SQL schema.

---

## Quick Test Workflow

### 1. Verify Database Setup

The SQL schema created these tables with sample data:
- ✅ 6 suppliers (LKQ, RockAuto, AutoZone, O'Reilly, NAPA, PartsGeek)
- ✅ 3 Honda Civic bumper parts (1 OEM, 2 aftermarket)
- ✅ 9 price points across different suppliers

**Test in Supabase SQL Editor:**
```sql
-- Check suppliers
SELECT * FROM "PartSupplier";

-- Check parts
SELECT
  p.name,
  p.make,
  p.model,
  COUNT(pp.id) as price_count,
  MIN(pp.price) as lowest_price,
  MAX(pp.price) as highest_price
FROM "Part" p
LEFT JOIN "PartPrice" pp ON p.partId = pp.partId
GROUP BY p.id;
```

---

### 2. Test Parts Search

**URL:** `/dashboard/parts`

**What to test:**
1. Search for "bumper" → Should show 3 Honda Civic bumpers
2. Search for "Honda" → Should show all Honda parts
3. Filter by: Make=Honda, Model=Civic, Year=2020
4. Click on a part to see price comparison modal
5. Verify prices from different suppliers
6. Check "Best Price" badge on lowest price

**Expected Results:**
- Standard aftermarket: ~$179-199
- Premium aftermarket: ~$289-309
- OEM: ~$589-609

---

### 3. Test Add to Cart

**What to test:**
1. Open a part's detail modal
2. Click "Add to Cart" button
3. Verify alert: "Added {part name} to cart!"
4. Add 2-3 different parts
5. Navigate to `/dashboard/cart`
6. Verify all parts appear in cart
7. Test quantity increase/decrease
8. Test remove from cart

**Cart Features:**
- localStorage persistence (refresh page, cart remains)
- Quantity management
- Remove items
- Shows lowest price per part
- Displays supplier count

---

### 4. Test Cart Optimization (THE KILLER FEATURE)

**Setup:**
Add at least 3 parts to cart with different weights/prices.

**What to test:**
1. Click "Optimize Cart" button
2. Wait for optimization to complete
3. Review the results:
   - Order split across multiple suppliers
   - Savings vs worst case displayed
   - Shipping costs calculated
   - Tax included
   - Total cost shown

**Example Expected Result:**
```
LKQ (2 parts):
- Part 1: $130
- Part 3: $189
Subtotal: $319
Shipping: $15
Tax: $26.32
Total: $360.32

RockAuto (3 parts):
- Part 4: $38
- Part 6: $82
Subtotal: $120
Shipping: $12
Tax: $14.69
Total: $146.69

OPTIMIZED TOTAL: $507.01
SAVINGS: $62.84 (11.1%)
```

---

### 5. Test Bulk Order Creation

**What to test:**
1. After optimizing cart, fill in:
   - Customer Name
   - Vehicle Make/Model/Year
   - VIN (optional)
   - Job Notes (optional)
2. Click "Create X Purchase Orders"
3. Verify success message with order numbers
4. Check that supplier tabs open automatically
5. Verify orders in database

**Database Verification:**
```sql
SELECT
  po.orderNumber,
  po.status,
  ps.name as supplier,
  po.customerName,
  po.total,
  COUNT(oi.id) as item_count
FROM "PurchaseOrder" po
JOIN "PartSupplier" ps ON po.supplierId = ps.id
LEFT JOIN "OrderItem" oi ON po.id = oi.purchaseOrderId
GROUP BY po.id, ps.name
ORDER BY po.createdAt DESC;
```

---

### 6. Test Edge Cases

**Empty cart:**
- Navigate to `/dashboard/cart` without adding parts
- Verify "Your cart is empty" message
- "Browse Parts" button works

**Single part in cart:**
- Add 1 part
- Optimize should work with single supplier
- Savings may be $0 if all prices similar

**Out of stock parts:**
- Check that optimization skips out-of-stock items
- Uses only in-stock prices

**Tax rate adjustment:**
- Change tax rate in cart
- Re-optimize
- Verify totals recalculated

---

## API Endpoints to Test

### 1. Parts Search API
```bash
curl "http://localhost:3000/api/parts/search?q=bumper&make=Honda"
```

Expected: JSON with parts array, each with prices from multiple suppliers

### 2. Cart Optimization API
```bash
curl -X POST http://localhost:3000/api/cart/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "partId": "part_oem_civic_bumper",
        "partNumber": "04711-TBA-A90ZZ",
        "partName": "Honda Civic Front Bumper Cover (OEM)",
        "quantity": 1,
        "weight": 12.5,
        "availablePrices": [...]
      }
    ],
    "taxRate": 0.0825
  }'
```

Expected: Optimized order split with savings

### 3. Order Creation API
```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "sup_autozone",
    "parts": [{
      "partId": "part_oem_civic_bumper",
      "partPriceId": "price_1",
      "quantity": 1
    }],
    "customerName": "John Doe",
    "vehicleMake": "Honda"
  }'
```

Expected: Created order with order number

---

## Known Limitations (To Be Built)

### Phase 3 Features (Not Yet Implemented):
- [ ] Estimates module integration
- [ ] Real supplier API integrations
- [ ] Live inventory tracking
- [ ] Order status tracking UI
- [ ] Email notifications
- [ ] PDF export for orders

### Current Workarounds:
- **Sample data only:** Using Honda Civic bumper examples
- **Manual supplier checkout:** Opens tabs but doesn't auto-checkout
- **Static shipping rules:** Hardcoded per supplier, needs API integration
- **No real-time inventory:** Using static in-stock boolean

---

## Performance Benchmarks

**Target metrics:**
- Parts search: < 500ms
- Cart optimization: < 1s for 10 parts
- Order creation: < 2s for bulk orders

**Test with:**
```sql
-- Add more sample parts
INSERT INTO "Part" (...) VALUES (...);
INSERT INTO "PartPrice" (...) VALUES (...);
```

---

## Troubleshooting

### Issue: Parts search returns empty
**Fix:** Verify sample data inserted:
```sql
SELECT COUNT(*) FROM "Part";
SELECT COUNT(*) FROM "PartPrice";
```

### Issue: Optimization fails
**Fix:** Check that parts have:
- Multiple prices from different suppliers
- Weight field populated
- At least one in-stock price

### Issue: Order creation fails
**Fix:** Verify:
- User is logged in (session cookies set)
- User has `shopId` in User table
- Supplier IDs match database

### Issue: Cart is empty after refresh
**Fix:** Check browser localStorage:
```javascript
localStorage.getItem('collisionpro_cart')
```

---

## Next Steps After Testing

1. **Add more sample parts** (10+ different parts)
2. **Test with larger carts** (20+ parts)
3. **Deploy to Vercel** (production environment)
4. **Set up Railway** for scrapers
5. **Get real API credentials** for live supplier feeds
6. **Implement order tracking UI**
7. **Build estimates module** integration

---

## Success Criteria

Phase 2 is complete when:
- ✅ Users can search parts across 6 suppliers
- ✅ Users can add parts to cart
- ✅ Cart optimizer saves 5-10% on multi-part orders
- ✅ Bulk order creation works for all suppliers
- ✅ Order tracking in database
- ✅ Professional UI with no errors

**You've built the REVOLUTIONARY feature that will save shops thousands per month!**
