-- Phase 3.6: Payment Portal (Stripe)
-- Run this in Supabase SQL Editor

-- Create Payment table for tracking all payments
CREATE TABLE IF NOT EXISTS "Payment" (
  "id" TEXT PRIMARY KEY,
  "estimateId" TEXT NOT NULL REFERENCES "Estimate"("id") ON DELETE CASCADE,
  "customerId" TEXT REFERENCES "Customer"("id") ON DELETE SET NULL,
  "amount" DECIMAL(10, 2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, processing, succeeded, failed, refunded
  "stripePaymentIntentId" TEXT UNIQUE,
  "stripeCheckoutSessionId" TEXT UNIQUE,
  "paymentMethod" TEXT, -- card, bank_transfer, etc.
  "receiptUrl" TEXT,
  "metadata" JSONB,
  "paidAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS "idx_payment_estimate" ON "Payment"("estimateId");
CREATE INDEX IF NOT EXISTS "idx_payment_customer" ON "Payment"("customerId");
CREATE INDEX IF NOT EXISTS "idx_payment_status" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "idx_payment_stripe_intent" ON "Payment"("stripePaymentIntentId");
CREATE INDEX IF NOT EXISTS "idx_payment_stripe_session" ON "Payment"("stripeCheckoutSessionId");

-- Add payment-related columns to Estimate table
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'unpaid'; -- unpaid, partial, paid
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "amountPaid" DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "depositRequired" DECIMAL(10, 2);
ALTER TABLE "Estimate" ADD COLUMN IF NOT EXISTS "depositPaid" BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "payment_access" ON "Payment"
  FOR ALL
  USING (true);

-- Grant permissions
GRANT ALL ON "Payment" TO authenticated;
GRANT ALL ON "Payment" TO service_role;
