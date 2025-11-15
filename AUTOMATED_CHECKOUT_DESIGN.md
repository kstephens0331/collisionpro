# Automated Checkout System Design

## Vision: One-Click Multi-Supplier Checkout

**User clicks once → All orders placed automatically across multiple suppliers**

---

## Architecture Overview

### Components Needed:

1. **Supplier Account Storage** - Save shop credentials for each supplier
2. **Payment Method Vault** - Securely store credit cards (PCI compliant)
3. **Checkout Engine** - Automate the purchase flow
4. **Order Sync Service** - Track confirmations and shipments

---

## 1. Supplier Account Management

### Database Schema Addition:

```sql
-- Store shop's supplier accounts
CREATE TABLE "ShopSupplierAccount" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,
  "supplierId" TEXT NOT NULL REFERENCES "PartSupplier"("id") ON DELETE CASCADE,

  -- Account credentials (encrypted)
  "accountNumber" TEXT,
  "email" TEXT,
  "passwordHash" TEXT, -- Encrypted, never stored in plain text

  -- OAuth tokens (if supplier supports it)
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiry" TIMESTAMP,

  -- Account details
  "isActive" BOOLEAN DEFAULT true,
  "defaultShippingAddressId" TEXT,
  "billingAddressId" TEXT,

  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE("shopId", "supplierId")
);

-- Store saved payment methods
CREATE TABLE "ShopPaymentMethod" (
  "id" TEXT PRIMARY KEY,
  "shopId" TEXT NOT NULL REFERENCES "Shop"("id") ON DELETE CASCADE,

  -- Payment processor (Stripe, etc.)
  "processorCustomerId" TEXT NOT NULL, -- Stripe customer ID
  "processorPaymentMethodId" TEXT NOT NULL, -- Stripe payment method ID

  -- Card info (last 4 digits only for display)
  "cardBrand" TEXT, -- Visa, Mastercard, Amex
  "cardLast4" TEXT,
  "cardExpMonth" INTEGER,
  "cardExpYear" INTEGER,

  -- Which suppliers accept this card
  "acceptedSuppliers" JSONB DEFAULT '[]', -- ['sup_autozone', 'sup_rockauto']

  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE("shopId", "processorPaymentMethodId")
);

-- Map payment methods to supplier accounts
CREATE TABLE "SupplierAccountPaymentMethod" (
  "id" TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL REFERENCES "ShopSupplierAccount"("id") ON DELETE CASCADE,
  "paymentMethodId" TEXT NOT NULL REFERENCES "ShopPaymentMethod"("id") ON DELETE CASCADE,
  "isDefault" BOOLEAN DEFAULT false,
  UNIQUE("accountId", "paymentMethodId")
);
```

---

## 2. Secure Payment Storage (PCI Compliant)

### Option A: Use Stripe (Recommended)

**Why Stripe:**
- PCI Level 1 certified
- Handles all card security
- We never touch actual card numbers
- Supports saving cards for future use
- Can charge cards on behalf of merchants

**Flow:**
```typescript
// 1. Shop adds payment method
const addPaymentMethod = async () => {
  // Frontend: Stripe.js collects card (never hits our server)
  const { paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: stripeCardElement,
  });

  // Backend: Save payment method to customer
  const customer = await stripe.customers.create({
    email: shop.email,
    name: shop.name,
    metadata: { shopId: shop.id }
  });

  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: customer.id,
  });

  // Save to our database (only IDs, not card numbers)
  await supabase.from('ShopPaymentMethod').insert({
    shopId: shop.id,
    processorCustomerId: customer.id,
    processorPaymentMethodId: paymentMethod.id,
    cardBrand: paymentMethod.card.brand,
    cardLast4: paymentMethod.card.last4,
    cardExpMonth: paymentMethod.card.exp_month,
    cardExpYear: paymentMethod.card.exp_year,
  });
};

// 2. When checking out, charge the card
const chargeCard = async (orderId: string, amount: number) => {
  const order = await getOrder(orderId);
  const paymentMethod = await getDefaultPaymentMethod(order.shopId);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    customer: paymentMethod.processorCustomerId,
    payment_method: paymentMethod.processorPaymentMethodId,
    off_session: true, // Charge without user present
    confirm: true,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
    }
  });

  return paymentIntent;
};
```

**Cost:**
- 2.9% + $0.30 per transaction
- Example: $500 order = $14.80 fee
- Shop still saves $85 from optimization = net $70.20 savings

### Option B: Direct Supplier Account Billing

**If supplier has shop account with Net 30 terms:**
```typescript
// No credit card needed
// Charge to supplier account directly via API
const checkoutWithAccount = async (order) => {
  const account = await getSupplierAccount(order.shopId, order.supplierId);

  // Use supplier's API to place order on account
  const supplierOrder = await supplierAPI.createOrder({
    accountNumber: account.accountNumber,
    items: order.items,
    billingType: 'account', // Bill to shop's Net 30 account
    poNumber: order.orderNumber,
  });

  return supplierOrder;
};
```

**Best of both worlds:**
- Use supplier account if available (no fees)
- Fall back to credit card if needed

---

## 3. Automated Checkout Engine

### Implementation Strategies:

### Strategy A: API Integration (Best)

**When supplier has checkout API:**

```typescript
// Example: AutoZone API checkout
const autoCheckout = async (order: PurchaseOrder) => {
  const account = await getSupplierAccount(order.shopId, 'sup_autozone');
  const paymentMethod = await getDefaultPaymentMethod(order.shopId);

  // 1. Authenticate with supplier API
  const auth = await autoZoneAPI.authenticate({
    email: account.email,
    apiKey: account.apiKey, // Or OAuth token
  });

  // 2. Create cart via API
  const cart = await autoZoneAPI.createCart({
    items: order.items.map(item => ({
      partNumber: item.partNumber,
      quantity: item.quantity,
    })),
  });

  // 3. Set shipping address
  await autoZoneAPI.setShippingAddress(cart.id, {
    addressId: account.defaultShippingAddressId,
  });

  // 4. Get final pricing (includes shop discounts)
  const pricing = await autoZoneAPI.calculatePricing(cart.id);

  // 5. Charge payment method
  let paymentResult;
  if (account.accountNumber) {
    // Use shop's supplier account (Net 30)
    paymentResult = await autoZoneAPI.setPaymentMethod(cart.id, {
      type: 'account',
      accountNumber: account.accountNumber,
    });
  } else {
    // Use credit card via Stripe
    const charge = await chargeCard(order.id, pricing.total);
    paymentResult = await autoZoneAPI.setPaymentMethod(cart.id, {
      type: 'credit_card',
      // Some suppliers accept payment tokens
      stripeToken: charge.id,
    });
  }

  // 6. Submit order
  const confirmation = await autoZoneAPI.submitOrder(cart.id);

  // 7. Update our PO record
  await supabase.from('PurchaseOrder').update({
    status: 'ordered',
    supplierOrderNumber: confirmation.orderNumber,
    supplierOrderUrl: confirmation.orderUrl,
    trackingNumber: confirmation.trackingNumber,
    actualTotal: pricing.total, // May differ from estimate
  }).eq('id', order.id);

  // 8. Create status history
  await supabase.from('OrderStatusHistory').insert({
    purchaseOrderId: order.id,
    status: 'ordered',
    notes: `Automatically ordered via API. Confirmation: ${confirmation.orderNumber}`,
    changedBy: 'system',
  });

  return confirmation;
};
```

### Strategy B: Browser Automation (Fallback)

**When API not available:**

```typescript
import puppeteer from 'puppeteer';

const browserCheckout = async (order: PurchaseOrder) => {
  const account = await getSupplierAccount(order.shopId, order.supplierId);
  const paymentMethod = await getDefaultPaymentMethod(order.shopId);

  const browser = await puppeteer.launch({
    headless: true, // Run in background
  });

  const page = await browser.newPage();

  try {
    // 1. Login
    await page.goto('https://www.autozone.com/login');
    await page.type('#email', account.email);
    await page.type('#password', await decryptPassword(account.passwordHash));
    await page.click('button[type="submit"]');
    await page.waitForNavigation();

    // 2. Add items to cart
    for (const item of order.items) {
      await page.goto(item.productUrl);
      await page.waitForSelector('button.add-to-cart');

      // Set quantity
      await page.type('input[name="quantity"]', item.quantity.toString());

      // Add to cart
      await page.click('button.add-to-cart');
      await page.waitForSelector('.cart-updated');
    }

    // 3. Go to checkout
    await page.goto('https://www.autozone.com/checkout');

    // 4. Select shipping address
    await page.select('#shipping-address', account.defaultShippingAddressId);

    // 5. Select payment method
    if (account.savedCardId) {
      // Use saved card on supplier site
      await page.click(`input[value="${account.savedCardId}"]`);
    } else {
      // Enter new card details (if allowed)
      await page.type('#card-number', 'STRIPE_TOKEN_HERE');
      // Note: Many sites don't allow automated card entry (fraud prevention)
    }

    // 6. Review and submit
    const total = await page.$eval('.order-total', el => el.textContent);

    // Verify total matches our estimate (within 5%)
    const estimatedTotal = order.total;
    const actualTotal = parseFloat(total.replace(/[^0-9.]/g, ''));

    if (Math.abs(actualTotal - estimatedTotal) / estimatedTotal > 0.05) {
      throw new Error(`Price mismatch: Expected $${estimatedTotal}, got $${actualTotal}`);
    }

    // Submit order
    await page.click('button.place-order');
    await page.waitForSelector('.order-confirmation');

    // 7. Extract order number
    const orderNumber = await page.$eval('.confirmation-number', el => el.textContent);

    // 8. Update our database
    await supabase.from('PurchaseOrder').update({
      status: 'ordered',
      supplierOrderNumber: orderNumber,
    }).eq('id', order.id);

    await browser.close();

    return { success: true, orderNumber };

  } catch (error) {
    await browser.close();

    // Mark order as failed
    await supabase.from('PurchaseOrder').update({
      status: 'failed',
      notes: `Automated checkout failed: ${error.message}`,
    }).eq('id', order.id);

    throw error;
  }
};
```

**Challenges with browser automation:**
- Sites actively prevent automation (CAPTCHA, bot detection)
- Breaks when site UI changes
- Slower than APIs
- May violate ToS

---

## 4. Complete User Flow

### Setup Phase (One-Time):

**1. Connect Supplier Accounts**
```
Settings → Supplier Accounts → Add AutoZone Account
- Enter email/password
- Or: OAuth login (if supported)
- Select default shipping address
- Verify account connected
```

**2. Add Payment Methods**
```
Settings → Payment Methods → Add Card
- Stripe card form (PCI compliant)
- Card never touches our servers
- Select which suppliers accept this card
- Mark as default
```

### Checkout Phase (Every Order):

**User Experience:**
```
1. User clicks "Optimize Cart"
   → Sees: "Buy from AutoZone ($200), RockAuto ($300)"

2. User clicks "Checkout All Orders"
   → Modal shows:
     ✓ AutoZone - Using account xxxx1234 (Visa ****1111)
     ✓ RockAuto - Using account yyyy5678 (Visa ****1111)
     Total: $500 + $14.50 processing = $514.50
     [Cancel] [Confirm Purchase]

3. User clicks "Confirm Purchase"
   → System processes in background:
     - Creates Stripe payment intents
     - Calls supplier APIs (or browser automation)
     - Places all orders automatically
     - Updates PO records with confirmation numbers

4. Success screen:
   ✓ 2 orders placed successfully
   - AutoZone: Order #AZ123456 ($200)
   - RockAuto: Order #RA789012 ($300)

   Email confirmations sent to shop email.
   Track orders in Dashboard → Orders

5. Automatic tracking sync:
   - System polls supplier APIs for tracking updates
   - Or: Parses email notifications
   - Updates order status automatically
```

---

## 5. Security & Compliance

### PCI DSS Compliance:

**What we NEVER do:**
- ❌ Store raw credit card numbers
- ❌ Store CVV codes
- ❌ Handle card data in our backend

**What we DO:**
- ✅ Use Stripe's PCI-compliant vault
- ✅ Store only Stripe tokens
- ✅ Encrypt supplier passwords
- ✅ Use OAuth when available

### Encryption Strategy:

```typescript
// Encrypt supplier passwords before storage
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

const encryptPassword = (password: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

const decryptPassword = (encryptedData: string): string => {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};
```

### OAuth Preferred:

**When supplier supports OAuth:**
```typescript
// Much more secure than storing passwords
const connectSupplierOAuth = async (supplierId: string) => {
  // 1. Redirect user to supplier's OAuth page
  const authUrl = await supplierAPI.getAuthorizationUrl({
    clientId: process.env.SUPPLIER_CLIENT_ID,
    redirectUri: 'https://collisionpro.com/auth/callback',
    scope: 'read_catalog write_orders read_shipments',
  });

  // User authorizes

  // 2. Exchange code for tokens
  const tokens = await supplierAPI.exchangeCodeForTokens(code);

  // 3. Store tokens (encrypted)
  await supabase.from('ShopSupplierAccount').insert({
    shopId: shop.id,
    supplierId,
    accessToken: await encryptToken(tokens.accessToken),
    refreshToken: await encryptToken(tokens.refreshToken),
    tokenExpiry: tokens.expiresAt,
  });
};
```

---

## 6. Implementation Phases

### Phase 1: Manual Setup (Current)
- ✅ Cart optimization
- ✅ PO creation
- ⚠️ Manual checkout

### Phase 2: Account Storage (Month 1)
- Add ShopSupplierAccount table
- Build supplier account settings UI
- Store credentials (encrypted)
- No automation yet

### Phase 3: Payment Vault (Month 2)
- Integrate Stripe
- Add ShopPaymentMethod table
- Build payment method UI
- Test card charging

### Phase 4: Semi-Automation (Month 3)
- Pre-fill checkout forms with saved data
- One-click copy part numbers
- Email order confirmations to system
- Manual confirmation required

### Phase 5: Full Automation (Months 4-6)
- API integrations where available
- Browser automation as fallback
- One-click multi-supplier checkout
- Automatic tracking sync

---

## 7. Cost Analysis

### Processing Fees:

**Stripe (Credit Card):**
- 2.9% + $0.30 per transaction
- $500 order = $14.80 fee

**Net 30 Account (No Fees):**
- $500 order = $0 fees
- But ties up shop credit line

**ROI Calculation:**
```
Average optimized cart: $500
Stripe fee: $14.80
Optimization savings: $85
Net savings: $70.20 (14% savings even with fees)

If using Net 30 accounts:
Net savings: $85 (17% savings, no fees)
```

### Monthly Costs:

**For 100 orders/month:**
- Stripe fees: ~$1,500
- But shops save: ~$8,500
- Net benefit: ~$7,000/month

**Alternative: Pass fees to shops**
- Shop pays $514.80 instead of $500
- Still saves $70.20 vs single-supplier
- CollisionPro breaks even on processing

---

## 8. Risk Mitigation

### What Could Go Wrong:

**1. Supplier detects automation**
- **Solution**: Use official APIs primarily
- **Fallback**: Require manual confirmation for browser automation

**2. Price changes between estimate and checkout**
- **Solution**: Show final price before confirming
- **Solution**: Abort if price difference > 5%

**3. Out of stock during checkout**
- **Solution**: Show real-time stock before optimization
- **Solution**: Fallback to next-best supplier automatically

**4. Payment fails**
- **Solution**: Retry logic
- **Solution**: Email shop to update payment method
- **Solution**: Mark order as "pending payment"

**5. Supplier TOS violation**
- **Solution**: Get written approval for automation
- **Solution**: Use APIs only, avoid scraping for checkout
- **Solution**: Become official reseller/partner

---

## Recommended Approach

**Short-term (Next 3 months):**
1. Build supplier account storage
2. Integrate Stripe for payment vault
3. Pre-fill checkout forms
4. Require manual review before purchase

**Medium-term (3-6 months):**
5. Negotiate API access with top suppliers
6. Build API checkout for AutoZone, RockAuto
7. Add one-click checkout for API-enabled suppliers

**Long-term (6-12 months):**
8. Full automation for all suppliers
9. Become official reseller partner
10. Negotiate better pricing for volume

**The key insight:** Even with processing fees, the optimization savings are so large that automated checkout is still highly profitable for shops.
