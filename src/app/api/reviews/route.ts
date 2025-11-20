import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, sendSMS } from "@/lib/notifications";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate unique ID
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// GET - Get reviews for a shop
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: "Shop ID is required" },
        { status: 400 }
      );
    }

    const { data: reviews, error } = await supabase
      .from("Review")
      .select(`
        *,
        Customer:customerId(firstName, lastName)
      `)
      .eq("shopId", shopId)
      .eq("isPublic", true)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch reviews" },
        { status: 500 }
      );
    }

    // Calculate average ratings
    const totalReviews = reviews?.length || 0;
    const avgRating = totalReviews > 0
      ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    return NextResponse.json({
      success: true,
      reviews: reviews || [],
      stats: {
        totalReviews,
        averageRating: Math.round(avgRating * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Reviews fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit a review or send review request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "request") {
      // Send review request
      return await sendReviewRequest(body);
    } else {
      // Submit a review
      return await submitReview(body);
    }
  } catch (error) {
    console.error("Review error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Send review request to customer
async function sendReviewRequest(body: {
  estimateId: string;
  shopId: string;
}) {
  const { estimateId, shopId } = body;

  // Get estimate with customer info
  const { data: estimate, error: estimateError } = await supabase
    .from("Estimate")
    .select("id, customerId, customerName, customerEmail, vehicleYear, vehicleMake, vehicleModel, reviewRequested")
    .eq("id", estimateId)
    .single();

  if (estimateError || !estimate) {
    return NextResponse.json(
      { success: false, error: "Estimate not found" },
      { status: 404 }
    );
  }

  if (estimate.reviewRequested) {
    return NextResponse.json(
      { success: false, error: "Review request already sent" },
      { status: 400 }
    );
  }

  // Get customer info
  const { data: customer } = await supabase
    .from("Customer")
    .select("email, phoneNumber, firstName")
    .eq("id", estimate.customerId)
    .single();

  if (!customer) {
    return NextResponse.json(
      { success: false, error: "Customer not found" },
      { status: 404 }
    );
  }

  const vehicleInfo = `${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}`;
  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/customer/review/${estimateId}`;

  // Send SMS
  if (customer.phoneNumber) {
    await sendSMS({
      to: customer.phoneNumber,
      message: `Hi ${customer.firstName}! How was your repair experience with us? We'd love your feedback. Leave a review: ${reviewUrl}`,
      customerId: estimate.customerId,
      estimateId,
      channel: "review",
    });
  }

  // Send Email
  if (customer.email) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">How Did We Do?</h1>
        </div>
        <div style="padding: 30px; background-color: #f8fafc;">
          <p style="color: #475569;">Hi ${customer.firstName},</p>
          <p style="color: #475569;">Thank you for choosing us for your vehicle repair. We hope you're satisfied with the work on your ${vehicleInfo}.</p>
          <p style="color: #475569;">We'd love to hear about your experience! Your feedback helps us improve and helps other customers make informed decisions.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Leave a Review</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">It only takes a minute and means a lot to us!</p>
          <p style="color: #475569; margin-top: 30px;">Thank you,<br>CollisionPro Team</p>
        </div>
        <div style="background-color: #e2e8f0; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
          <p style="margin: 0;">This is an automated message from CollisionPro</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: customer.email,
      subject: `How was your repair experience? - ${vehicleInfo}`,
      html: emailHtml,
      customerId: estimate.customerId,
      estimateId,
      channel: "review",
    });
  }

  // Update estimate to mark review as requested
  await supabase
    .from("Estimate")
    .update({
      reviewRequested: true,
      reviewRequestedAt: new Date().toISOString(),
    })
    .eq("id", estimateId);

  return NextResponse.json({
    success: true,
    message: "Review request sent successfully",
  });
}

// Submit a customer review
async function submitReview(body: {
  customerId: string;
  estimateId: string;
  rating: number;
  comment?: string;
  serviceQuality?: number;
  communication?: number;
  timeliness?: number;
  wouldRecommend?: boolean;
}) {
  const {
    customerId,
    estimateId,
    rating,
    comment,
    serviceQuality,
    communication,
    timeliness,
    wouldRecommend,
  } = body;

  // Validate required fields
  if (!customerId || !estimateId || !rating) {
    return NextResponse.json(
      { success: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { success: false, error: "Rating must be between 1 and 5" },
      { status: 400 }
    );
  }

  // Verify estimate belongs to customer
  const { data: estimate, error: estimateError } = await supabase
    .from("Estimate")
    .select("id, shopId, reviewId")
    .eq("id", estimateId)
    .eq("customerId", customerId)
    .single();

  if (estimateError || !estimate) {
    return NextResponse.json(
      { success: false, error: "Estimate not found or access denied" },
      { status: 404 }
    );
  }

  if (estimate.reviewId) {
    return NextResponse.json(
      { success: false, error: "Review already submitted for this estimate" },
      { status: 400 }
    );
  }

  // Create review
  const reviewId = nanoid();
  const { error: reviewError } = await supabase.from("Review").insert({
    id: reviewId,
    customerId,
    estimateId,
    shopId: estimate.shopId,
    rating,
    comment: comment || null,
    serviceQuality: serviceQuality || null,
    communication: communication || null,
    timeliness: timeliness || null,
    wouldRecommend: wouldRecommend ?? null,
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  if (reviewError) {
    console.error("Error creating review:", reviewError);
    return NextResponse.json(
      { success: false, error: "Failed to submit review" },
      { status: 500 }
    );
  }

  // Update estimate with review ID
  await supabase
    .from("Estimate")
    .update({ reviewId })
    .eq("id", estimateId);

  return NextResponse.json({
    success: true,
    message: "Review submitted successfully",
    reviewId,
  });
}
