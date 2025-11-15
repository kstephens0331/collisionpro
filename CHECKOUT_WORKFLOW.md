# CollisionPro Checkout & Purchasing Workflow

## Current Implementation (What We Built)

### Flow: Cart → Optimize → Create Orders → Checkout on Supplier Sites

```
User Journey:
1. Add parts to cart
2. Click "Optimize Cart"
3. See optimized split (e.g., 2 from AutoZone, 3 from RockAuto)
4. Fill in vehicle/customer info
5. Click "Create Purchase Orders"
6. System creates POs in database
7. Browser opens tabs to each supplier's website
8. User manually checks out on each supplier site
9. User enters supplier order numbers back into CollisionPro
```

**What happens now:**

```javascript
// After user clicks "Create Purchase Orders"
const createAllOrders = async () => {
  // 1. Create PO records in database for each supplier
  for (const optimizedOrder of orders) {
    await fetch('/api/orders/create', {
      method: 'POST',
      body: JSON.stringify({
        supplierId: order.supplierId,
        parts: order.items,
        customerName,
        vehicleInfo,
        // Status: 'pending'
      })
    });
  }

  // 2. Open supplier product pages in new tabs
  orders.forEach(order => {
    order.items.forEach(item => {
      window.open(item.productUrl, '_blank'); // Opens AutoZone.com, RockAuto.com, etc.
    });
  });

  // 3. User now on supplier websites
  // User adds items to THEIR cart
  // User checks out on THEIR site
  // User pays with shop credit card/account
};
```

**The Gap:**
- We create the PO record
- We open the supplier pages
- **User has to manually add items to supplier cart and checkout**
- User has to come back and update PO with tracking info

---

## Why We Can't Auto-Checkout (Currently)

### Technical Barriers:

**1. No Direct API Access**
- AutoZone, RockAuto, etc. don't have public checkout APIs
- They have affiliate/product APIs but not cart/purchase APIs
- Requires business partnership agreements

**2. Payment Processing**
- We don't store shop credit cards (PCI compliance nightmare)
- Each shop has their own accounts with suppliers
- Different payment terms (Net 30, credit cards, shop accounts)

**3. Legal/Security**
- Can't auto-submit purchases without explicit user action
- Shops need to review final prices before committing
- Liability if wrong parts ordered

---

## Ideal Future Workflow (With API Partnerships)

### Option A: Direct Integration (Best Case)

```
Prerequisites:
- API partnership agreements with suppliers
- OAuth integration for shop accounts
- Supplier API supports cart + checkout

Flow:
1. User clicks "Create & Submit Orders"
2. System uses supplier APIs to:
   - Add items to supplier cart via API
   - Apply shop account credentials
   - Calculate final price with shop discounts
3. User reviews final totals in CollisionPro
4. User clicks "Confirm & Purchase"
5. System submits orders via API
6. Orders automatically created at suppliers
7. Tracking numbers sync back to CollisionPro
8. Done - no tab switching required
```

**Implementation with AutoZone API example:**
```javascript
// Future state with API
const autoCheckout = async (order) => {
  // 1. Create cart via API
  const cart = await autoZoneAPI.createCart({
    shopAccountId: shop.autoZoneAccountId,
    items: order.items.map(item => ({
      partNumber: item.partNumber,
      quantity: item.quantity
    }))
  });

  // 2. Get final pricing with shop discounts
  const pricing = await autoZoneAPI.getPricing(cart.id);

  // 3. Show user for confirmation
  confirmDialog({
    supplier: 'AutoZone',
    items: pricing.items,
    subtotal: pricing.subtotal,
    tax: pricing.tax,
    shipping: pricing.shipping,
    total: pricing.total
  });

  // 4. On user confirmation, submit order
  if (userConfirmed) {
    const order = await autoZoneAPI.submitOrder({
      cartId: cart.id,
      paymentMethod: shop.autoZonePaymentMethod, // 'account' or 'card_on_file'
      shippingAddress: shop.address
    });

    // 5. Update our PO with supplier order number
    await updatePurchaseOrder({
      supplierOrderNumber: order.orderNumber,
      trackingNumber: order.trackingNumber,
      status: 'ordered'
    });
  }
};
```

---

## Option B: Browser Automation (Medium Complexity)

**If APIs not available but want better UX:**

Use Puppeteer to automate the manual steps:

```javascript
// Server-side automation
const automateCheckout = async (order, shopCredentials) => {
  const browser = await puppeteer.launch({ headless: false }); // Show to user
  const page = await browser.newPage();

  // 1. Login to supplier
  await page.goto('https://www.autozone.com/login');
  await page.type('#email', shopCredentials.autozone.email);
  await page.type('#password', shopCredentials.autozone.password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();

  // 2. Add items to cart
  for (const item of order.items) {
    await page.goto(item.productUrl);
    await page.click('button.add-to-cart');
    await page.waitForSelector('.cart-count-updated');
  }

  // 3. Navigate to checkout
  await page.goto('https://www.autozone.com/checkout');

  // 4. Fill shipping info (pre-filled from shop profile)
  await page.select('#shipping-address', shop.defaultAddressId);

  // 5. STOP - Let user review and complete payment
  await page.waitForSelector('.order-confirmation', { timeout: 300000 }); // Wait 5 min

  // 6. Scrape order number from confirmation
  const orderNumber = await page.$eval('.order-number', el => el.textContent);

  // 7. Update our PO
  await updatePurchaseOrder({
    supplierOrderNumber: orderNumber,
    status: 'ordered'
  });

  await browser.close();
};
```

**Pros:**
- Works without API partnerships
- Automates tedious parts
- User still reviews before payment

**Cons:**
- Fragile (breaks when sites change)
- Slower than API
- Requires storing credentials (security risk)
- Might violate supplier ToS

---

## Option C: Hybrid Approach (What We Should Build Next)

### Phase 1: What We Have Now
✅ Cart optimization
✅ Create PO records
✅ Open supplier tabs

### Phase 2: Enhanced Manual Flow (Next Sprint)

**Improvements:**
1. **Pre-fill Cart Links**
   ```javascript
   // Generate direct "add to cart" URLs
   const autoZoneCartUrl = buildAutoZoneCartUrl(order.items);
   // https://www.autozone.com/cart?add=PART1:1&add=PART2:2

   window.open(autoZoneCartUrl, '_blank');
   // User arrives with items already in cart, just needs to checkout
   ```

2. **Order Status Tracking UI**
   - User returns to CollisionPro after checkout
   - Enters supplier order number
   - Enters tracking number when shipped
   - Status updates: Pending → Ordered → Shipped → Delivered

3. **Supplier Account Integration**
   - Store shop's supplier account numbers
   - Pre-fill account info in forms
   - Track historical orders per supplier

4. **Email Order Confirmation Parser**
   - User forwards supplier confirmation emails
   - System auto-extracts order numbers and tracking
   - Updates PO status automatically

### Phase 3: API Integrations (Long-term)

**Priority order:**
1. **RockAuto** - Often has API for bulk buyers
2. **NAPA** - TecDoc standard API
3. **O'Reilly** - Partner program available
4. **AutoZone** - Business development needed
5. **LKQ** - Wholesale portal integration
6. **PartsGeek** - Affiliate API already exists

---

## Recommended Immediate Next Steps

### 1. Build Order Tracking UI

**New page:** `/dashboard/orders`

```typescript
// Shows all purchase orders
const OrdersPage = () => {
  return (
    <div>
      <h1>Purchase Orders</h1>

      {orders.map(order => (
        <OrderCard key={order.id}>
          <OrderHeader>
            {order.orderNumber} - {order.supplier.name}
            <StatusBadge status={order.status} />
          </OrderHeader>

          <OrderItems items={order.items} />

          <OrderActions>
            {order.status === 'pending' && (
              <>
                <Input
                  placeholder="Enter supplier order number"
                  onChange={(e) => setSupplierOrderNumber(e.target.value)}
                />
                <Button onClick={() => markAsOrdered(order.id, supplierOrderNumber)}>
                  Mark as Ordered
                </Button>
              </>
            )}

            {order.status === 'ordered' && (
              <>
                <Input
                  placeholder="Enter tracking number"
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
                <Button onClick={() => markAsShipped(order.id, trackingNumber)}>
                  Mark as Shipped
                </Button>
              </>
            )}

            {order.trackingNumber && (
              <Button onClick={() => window.open(buildTrackingUrl(order))}>
                Track Package
              </Button>
            )}
          </OrderActions>
        </OrderCard>
      ))}
    </div>
  );
};
```

### 2. Add "Quick Add to Cart" Links

**Update cart optimization results:**
```typescript
<Button
  onClick={() => {
    // Copy all part numbers to clipboard
    const partNumbers = order.items.map(i => i.partNumber).join('\n');
    navigator.clipboard.writeText(partNumbers);

    // Open supplier with special URL if possible
    const supplierUrl = buildQuickAddUrl(order.supplier, order.items);
    window.open(supplierUrl, '_blank');
  }}
>
  Quick Add to {order.supplier.name} Cart
</Button>
```

### 3. Add Supplier Account Management

**Settings page:** `/dashboard/settings/suppliers`

```typescript
// Store supplier account info
const SupplierSettings = () => {
  return (
    <form>
      <h2>Supplier Accounts</h2>

      <SupplierAccountInput
        supplier="AutoZone"
        fields={['accountNumber', 'email', 'phoneNumber']}
      />

      <SupplierAccountInput
        supplier="RockAuto"
        fields={['customerNumber', 'email']}
      />

      {/* Auto-fill these in checkout process */}
    </form>
  );
};
```

---

## Complete User Experience (Current + Improvements)

### Optimized Flow:

**1. Parts Selection**
- User searches and adds 7 parts to cart

**2. Optimization**
- Click "Optimize Cart"
- See: 2 from AutoZone ($200), 3 from RockAuto ($350), 2 from NAPA ($180)
- Total: $730 (saves $85 vs single supplier)

**3. Create Orders**
- Fill in customer/vehicle info once
- Click "Create 3 Purchase Orders"
- System creates 3 PO records (status: pending)

**4. Checkout (Semi-Automated)**
- Browser opens 3 tabs:
  - AutoZone with part numbers in URL/clipboard
  - RockAuto with part numbers in URL/clipboard
  - NAPA with part numbers in URL/clipboard
- User adds items to cart on each site (quick since parts pre-selected)
- User checks out using shop account
- User receives order confirmations via email

**5. Order Tracking**
- User goes to `/dashboard/orders`
- Enters supplier order numbers for each PO
- Marks as "Ordered"
- When shipping notification arrives, enters tracking numbers
- Marks as "Shipped"
- System shows all active orders and tracking

**6. Receiving**
- When parts arrive, mark as "Delivered"
- Associate parts with estimate/repair job
- Track part usage and costs

---

## API Integration Roadmap

### Phase 1: Investigation (Month 1)
- Contact each supplier's business development
- Request API documentation
- Understand requirements (volume, fees, integration time)

### Phase 2: MVP Integration (Months 2-3)
- Start with 1-2 suppliers with easiest APIs
- Build OAuth connection flow
- Implement read-only features first (inventory, pricing)

### Phase 3: Checkout Integration (Months 4-6)
- Add cart creation via API
- Add order submission
- Test with pilot shops

### Phase 4: Full Automation (Months 7-12)
- All 6 suppliers integrated
- One-click checkout
- Automatic tracking sync
- Inventory alerts

---

## Summary: What Checkout Looks Like Today

**Current State:**
1. ✅ User optimizes cart
2. ✅ Creates PO records in database
3. ⚠️ Browser opens supplier websites
4. ❌ User manually adds items to supplier carts
5. ❌ User manually checks out
6. ❌ User manually enters order numbers back in CollisionPro
7. ❌ User manually tracks shipments

**Next Phase (Easy Wins):**
1. ✅ Pre-fill cart URLs where possible
2. ✅ Build order tracking UI
3. ✅ Add supplier account management
4. ✅ Email order confirmation parsing
5. ✅ Better UX for entering tracking info

**Future State (With APIs):**
1. ✅ User clicks "Checkout All"
2. ✅ System adds items to supplier carts via API
3. ✅ User reviews final pricing in CollisionPro
4. ✅ User confirms
5. ✅ Orders submitted automatically
6. ✅ Tracking syncs automatically
7. ✅ Zero tab switching

**The smart cart optimizer is still revolutionary even with manual checkout** - it tells shops exactly where to buy each part to save the most money. That's the hard part. The checkout is just execution.
