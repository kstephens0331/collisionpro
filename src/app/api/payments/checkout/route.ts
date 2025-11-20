import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Lazy Stripe initialization
let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient && process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    });
  }
  return stripeClient!;
}

// Generate unique ID
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// POST - Create a Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { estimateId, customerId, amount, depositOnly } = body;

    if (!estimateId || !customerId || !amount) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify customer owns this estimate
    const { data: estimate, error: estimateError } = await supabase
      .from("Estimate")
      .select("id, estimateNumber, customerId, customerName, customerEmail, vehicleYear, vehicleMake, vehicleModel, totalAmount, depositRequired")
      .eq("id", estimateId)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    if (estimate.customerId !== customerId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get customer info
    const { data: customer } = await supabase
      .from("Customer")
      .select("email, firstName, lastName")
      .eq("id", customerId)
      .single();

    // Calculate the actual amount to charge (in cents)
    const chargeAmount = depositOnly && estimate.depositRequired
      ? Math.round(estimate.depositRequired * 100)
      : Math.round(amount * 100);

    const vehicleDescription = `${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}`;
    const paymentDescription = depositOnly
      ? `Deposit for Estimate #${estimate.estimateNumber} - ${vehicleDescription}`
      : `Payment for Estimate #${estimate.estimateNumber} - ${vehicleDescription}`;

    // Create Stripe checkout session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customer?.email || estimate.customerEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: depositOnly ? "Repair Deposit" : "Repair Payment",
              description: paymentDescription,
            },
            unit_amount: chargeAmount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        estimateId,
        customerId,
        depositOnly: depositOnly ? "true" : "false",
        estimateNumber: estimate.estimateNumber,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/customer/estimates/${estimateId}`,
    });

    // Create payment record
    const paymentId = nanoid();
    await supabase.from("Payment").insert({
      id: paymentId,
      estimateId,
      customerId,
      amount: chargeAmount / 100,
      currency: "usd",
      status: "pending",
      stripeCheckoutSessionId: session.id,
      metadata: {
        depositOnly,
        estimateNumber: estimate.estimateNumber,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
