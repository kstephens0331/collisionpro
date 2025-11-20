import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendStatusUpdateNotification } from "@/lib/notifications";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Valid status values
const VALID_STATUSES = [
  "draft",
  "sent",
  "approved",
  "received",
  "in_progress",
  "waiting_for_parts",
  "ready",
  "completed",
  "cancelled"
];

// Generate unique ID
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// GET - Get status history for an estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get current estimate with status
    const { data: estimate, error: estimateError } = await supabase
      .from("Estimate")
      .select("id, status, estimatedCompletion, customerName")
      .eq("id", id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Get status history
    const { data: statusHistory, error: historyError } = await supabase
      .from("RepairStatus")
      .select("*")
      .eq("estimateId", id)
      .order("createdAt", { ascending: true });

    if (historyError) {
      console.error("Error fetching status history:", historyError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch status history" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      currentStatus: estimate.status,
      estimatedCompletion: estimate.estimatedCompletion,
      history: statusHistory || [],
    });
  } catch (error) {
    console.error("Status fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update status of an estimate
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, updatedBy, estimatedCompletion } = body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`
        },
        { status: 400 }
      );
    }

    // Validate updatedBy
    if (!updatedBy) {
      return NextResponse.json(
        { success: false, error: "updatedBy is required" },
        { status: 400 }
      );
    }

    // Check if estimate exists and get customer/vehicle info for notifications
    const { data: estimate, error: estimateError } = await supabase
      .from("Estimate")
      .select("id, status, customerId, vehicleYear, vehicleMake, vehicleModel")
      .eq("id", id)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Update estimate status
    const updateData: Record<string, unknown> = { status };
    if (estimatedCompletion) {
      updateData.estimatedCompletion = estimatedCompletion;
    }

    const { error: updateError } = await supabase
      .from("Estimate")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating estimate status:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update status" },
        { status: 500 }
      );
    }

    // Create status history entry
    const statusEntry = {
      id: nanoid(),
      estimateId: id,
      status,
      notes: notes || null,
      updatedBy,
      createdAt: new Date().toISOString(),
    };

    const { error: historyError } = await supabase
      .from("RepairStatus")
      .insert(statusEntry);

    if (historyError) {
      console.error("Error creating status history:", historyError);
      // Don't fail the request, status was updated
    }

    // Send notification to customer if they exist
    if (estimate.customerId) {
      const vehicleInfo = `${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}`;
      try {
        await sendStatusUpdateNotification(
          estimate.customerId,
          id,
          status,
          vehicleInfo
        );
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Don't fail the request, status was updated
      }
    }

    return NextResponse.json({
      success: true,
      message: "Status updated successfully",
      status,
      estimatedCompletion: estimatedCompletion || null,
    });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
