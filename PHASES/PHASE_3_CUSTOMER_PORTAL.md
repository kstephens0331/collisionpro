# Phase 3: Customer Portal & Automated Updates

**Duration**: Weeks 5-6
**Status**: 🚧 IN PROGRESS
**Started**: January 2025
**Completion**: 0% (0/7 sub-phases)

---

## 🎯 Objective

Build a customer-facing portal that allows vehicle owners to:
- Track repair status in real-time
- View photos of their vehicle
- Receive automated SMS/email updates
- Make payments online
- Leave reviews

**Competitive Advantage**: Most shops still call/email customers manually. This automation saves time and improves customer satisfaction.

---

## 📋 Sub-Phases

### Phase 3.1: Customer Registration & Authentication ⏸️ NOT STARTED
**Goal**: Allow customers to create accounts and log in to view their repairs

**Features**:
- Customer registration flow (email + password)
- Customer login page
- Password reset functionality
- Customer dashboard layout
- Link customers to their estimates/repairs

**Database Tables**:
- `Customer` - Customer accounts (separate from shop users)
- Update `Estimate` table to link to customers

**API Endpoints**:
- `POST /api/customer/register` - Create customer account
- `POST /api/customer/login` - Customer authentication
- `POST /api/customer/forgot-password` - Password reset
- `GET /api/customer/estimates` - Get customer's estimates

**UI Pages**:
- `/customer/register` - Registration form
- `/customer/login` - Login form
- `/customer/dashboard` - Customer dashboard
- `/customer/estimates` - List of customer's repairs

**Dependencies**: None (uses existing NextAuth setup)

---

### Phase 3.2: Repair Status Tracking ⏸️ NOT STARTED
**Goal**: Show customers real-time status of their repair

**Features**:
- Status workflow (Received → In Progress → Waiting for Parts → Ready → Completed)
- Timeline view showing status changes
- Estimated completion date
- Shop updates visible to customer

**Database Tables**:
- `RepairStatus` - Status history for each estimate
- Add `status` and `estimatedCompletion` to `Estimate`

**API Endpoints**:
- `GET /api/customer/estimates/:id/status` - Get status timeline
- `PATCH /api/estimates/:id/status` - Shop updates status (shop side)

**UI Components**:
- Status timeline component
- Status badge component
- Progress indicator

---

### Phase 3.3: Photo Upload & Gallery ⏸️ NOT STARTED
**Goal**: Allow shops to upload photos and customers to view them

**Features**:
- Photo upload from shop dashboard
- Photo gallery on customer portal
- Before/after photo comparison
- Photo categories (damage, repair progress, completed)

**Storage**: Supabase Storage for images

**Database Tables**:
- `Photo` - Photo metadata (URL, category, uploadedAt)

**API Endpoints**:
- `POST /api/estimates/:id/photos` - Upload photo (shop)
- `GET /api/customer/estimates/:id/photos` - Get photos (customer)
- `DELETE /api/estimates/:id/photos/:photoId` - Delete photo (shop)

**UI Components**:
- Photo upload component (shop)
- Photo gallery component (customer)
- Before/after slider component

---

### Phase 3.4: SMS Notifications (Twilio) ⏸️ NOT STARTED
**Goal**: Send automated SMS updates to customers

**Features**:
- SMS on status change (e.g., "Your vehicle is ready for pickup!")
- SMS on estimate approval needed
- SMS on payment received
- SMS for review request

**Service**: Twilio API

**Database Tables**:
- `Notification` - Log of all notifications sent
- Add `phoneNumber` to `Customer` table

**API Endpoints**:
- `POST /api/notifications/sms` - Send SMS (internal)

**Environment Variables**:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

---

### Phase 3.5: Email Notifications ⏸️ NOT STARTED
**Goal**: Send automated email updates to customers

**Features**:
- Email on estimate received
- Email on status change
- Email on payment received
- Email for review request
- Professional HTML email templates

**Service**: Resend (already integrated in Phase 2.9!)

**Database Tables**:
- Use existing `EstimateEmailLog` and `EstimateHistory`
- Add `NotificationPreferences` table (opt-in/opt-out)

**Email Templates**:
- Estimate received
- Status update
- Payment confirmation
- Review request

---

### Phase 3.6: Payment Portal (Stripe) ⏸️ NOT STARTED
**Goal**: Allow customers to pay online via credit card

**Features**:
- Stripe payment integration
- Payment intent creation
- Secure checkout flow
- Payment confirmation
- Receipt generation

**Service**: Stripe API

**Database Tables**:
- `Payment` - Payment records
- Add `paymentStatus` to `Estimate` (unpaid, partial, paid)

**API Endpoints**:
- `POST /api/estimates/:id/payment-intent` - Create payment intent
- `POST /api/webhooks/stripe` - Handle Stripe webhooks
- `GET /api/customer/estimates/:id/receipt` - Download receipt

**Environment Variables**:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

### Phase 3.7: Review Request Automation ⏸️ NOT STARTED
**Goal**: Automatically request reviews after job completion

**Features**:
- Automatic review request email 24 hours after completion
- Links to Google, Yelp, Facebook reviews
- Review tracking dashboard for shops

**Database Tables**:
- `Review` - Track review requests and responses

**API Endpoints**:
- `POST /api/reviews/request` - Send review request
- `GET /api/reviews` - Get review statistics (shop dashboard)

**Automation**:
- Cron job or background worker to send review requests

---

## 🗄️ Database Schema Changes

### New Tables

```sql
-- Customer accounts
CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Repair status tracking
CREATE TABLE "RepairStatus" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "notes" TEXT,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Photos
CREATE TABLE "Photo" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "url" TEXT NOT NULL,
  "category" TEXT NOT NULL, -- damage, progress, completed
  "caption" TEXT,
  "uploadedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id") ON DELETE CASCADE,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL, -- sms, email
  "channel" TEXT NOT NULL, -- status_update, payment, review
  "sentAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "status" TEXT NOT NULL DEFAULT 'sent'
);

-- Payments
CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id"),
  "amount" DECIMAL(10,2) NOT NULL,
  "status" TEXT NOT NULL, -- pending, succeeded, failed
  "stripePaymentIntentId" TEXT,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Review requests
CREATE TABLE "Review" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "customerId" TEXT NOT NULL REFERENCES "Customer"("id"),
  "requestedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  "platform" TEXT, -- google, yelp, facebook
  "rating" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'requested' -- requested, completed, skipped
);
```

### Table Updates

```sql
-- Link estimates to customers
ALTER TABLE "Estimate" ADD COLUMN "customerId" TEXT REFERENCES "Customer"("id");

-- Add repair status tracking
ALTER TABLE "Estimate" ADD COLUMN "status" TEXT DEFAULT 'draft';
ALTER TABLE "Estimate" ADD COLUMN "estimatedCompletion" DATE;

-- Add payment tracking
ALTER TABLE "Estimate" ADD COLUMN "paymentStatus" TEXT DEFAULT 'unpaid';
```

---

## 📦 Dependencies to Add

```json
{
  "twilio": "^5.3.7",
  "stripe": "^18.3.0",
  "@stripe/stripe-js": "^4.13.0"
}
```

Note: `resend` already added in Phase 2.9

---

## 🔧 Environment Variables Required

```bash
# Twilio (SMS)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Already configured in Phase 2.9:
RESEND_API_KEY=re_... (for email notifications)
```

---

## 🎯 Success Criteria

- [x] Phase 3 planning document created
- [ ] Customer registration and login working
- [ ] Customers can view their repair status
- [ ] Photo upload and gallery functional
- [ ] SMS notifications sending successfully
- [ ] Email notifications sending successfully
- [ ] Stripe payments processing
- [ ] Review requests automated
- [ ] Build passing with 0 errors
- [ ] All features tested end-to-end

---

## 📈 Next Phase

**Phase 4**: Real-Time Parts Pricing (PartsTech Integration)

---

**Phase 3 Status**: 🚧 IN PROGRESS
**Started**: January 2025
**Current Sub-Phase**: 3.1 - Customer Registration & Authentication
