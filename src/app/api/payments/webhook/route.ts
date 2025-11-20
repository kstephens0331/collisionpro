import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendEmail, sendSMS } from "@/lib/notifications";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;
    const stripe = getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleSuccessfulPayment(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleExpiredSession(session);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handleFailedPayment(paymentIntent);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const { estimateId, customerId, depositOnly } = session.metadata || {};

  if (!estimateId) {
    console.error("No estimateId in session metadata");
    return;
  }

  const amountPaid = (session.amount_total || 0) / 100;

  // Update payment record
  await supabase
    .from("Payment")
    .update({
      status: "succeeded",
      stripePaymentIntentId: session.payment_intent as string,
      paymentMethod: "card",
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("stripeCheckoutSessionId", session.id);

  // Get current estimate
  const { data: estimate } = await supabase
    .from("Estimate")
    .select("totalAmount, amountPaid, depositRequired")
    .eq("id", estimateId)
    .single();

  if (!estimate) return;

  const newAmountPaid = (estimate.amountPaid || 0) + amountPaid;
  const totalAmount = estimate.totalAmount || 0;

  // Determine payment status
  let paymentStatus = "unpaid";
  if (newAmountPaid >= totalAmount) {
    paymentStatus = "paid";
  } else if (newAmountPaid > 0) {
    paymentStatus = "partial";
  }

  // Update estimate
  const updateData: Record<string, unknown> = {
    amountPaid: newAmountPaid,
    paymentStatus,
  };

  if (depositOnly === "true") {
    updateData.depositPaid = true;
  }

  await supabase
    .from("Estimate")
    .update(updateData)
    .eq("id", estimateId);

  // Send confirmation notification
  if (customerId) {
    await sendPaymentConfirmation(customerId, estimateId, amountPaid, depositOnly === "true");
  }
}

async function handleExpiredSession(session: Stripe.Checkout.Session) {
  // Update payment record to failed
  await supabase
    .from("Payment")
    .update({
      status: "failed",
      updatedAt: new Date().toISOString(),
    })
    .eq("stripeCheckoutSessionId", session.id);
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  // Update payment record
  await supabase
    .from("Payment")
    .update({
      status: "failed",
      updatedAt: new Date().toISOString(),
    })
    .eq("stripePaymentIntentId", paymentIntent.id);
}

async function sendPaymentConfirmation(
  customerId: string,
  estimateId: string,
  amount: number,
  isDeposit: boolean
) {
  // Get customer and estimate info
  const { data: customer } = await supabase
    .from("Customer")
    .select("email, phoneNumber, firstName")
    .eq("id", customerId)
    .single();

  const { data: estimate } = await supabase
    .from("Estimate")
    .select("estimateNumber, vehicleYear, vehicleMake, vehicleModel")
    .eq("id", estimateId)
    .single();

  if (!customer || !estimate) return;

  const vehicleInfo = `${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}`;
  const paymentType = isDeposit ? "Deposit" : "Payment";

  // Send SMS
  if (customer.phoneNumber) {
    const message = `CollisionPro: ${paymentType} of $${amount.toFixed(2)} received for your ${vehicleInfo}. Thank you!`;
    await sendSMS({
      to: customer.phoneNumber,
      message,
      customerId,
      estimateId,
      channel: "payment",
    });
  }

  // Send Email
  if (customer.email) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #16a34a; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Payment Confirmed</h1>
        </div>
        <div style="padding: 30px; background-color: #f8fafc;">
          <p style="color: #475569;">Hi ${customer.firstName},</p>
          <p style="color: #475569;">We've received your ${paymentType.toLowerCase()} for your vehicle repair.</p>
          <div style="background-color: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Amount Paid</p>
            <p style="margin: 5px 0 0 0; color: #16a34a; font-weight: bold; font-size: 24px;">$${amount.toFixed(2)}</p>
            <p style="margin: 15px 0 0 0; color: #64748b; font-size: 14px;">Vehicle</p>
            <p style="margin: 5px 0 0 0; color: #1e293b; font-weight: bold;">${vehicleInfo}</p>
            <p style="margin: 15px 0 0 0; color: #64748b; font-size: 14px;">Estimate</p>
            <p style="margin: 5px 0 0 0; color: #1e293b;">#${estimate.estimateNumber}</p>
          </div>
          <p style="color: #475569;">Log in to your customer portal to view your estimate details and payment history.</p>
          <p style="color: #475569; margin-top: 30px;">Thank you,<br>CollisionPro Team</p>
        </div>
        <div style="background-color: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">This is an automated receipt from CollisionPro</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: customer.email,
      subject: `Payment Confirmed: $${amount.toFixed(2)} - ${vehicleInfo}`,
      html: emailHtml,
      customerId,
      estimateId,
      channel: "payment",
    });
  }
}
