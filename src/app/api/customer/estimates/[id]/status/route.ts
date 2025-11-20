import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Get status timeline for customer's estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Verify estimate belongs to customer
    const { data: estimate, error: estimateError } = await supabase
      .from("Estimate")
      .select("id, status, estimatedCompletion, customerName, vehicleYear, vehicleMake, vehicleModel, estimateNumber, totalAmount, amountPaid, paymentStatus, depositRequired, depositPaid")
      .eq("id", id)
      .eq("customerId", customerId)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found or access denied" },
        { status: 404 }
      );
    }

    // Get status history
    const { data: statusHistory, error: historyError } = await supabase
      .from("RepairStatus")
      .select("id, status, notes, createdAt")
      .eq("estimateId", id)
      .order("createdAt", { ascending: true });

    if (historyError) {
      console.error("Error fetching status history:", historyError);
      return NextResponse.json(
        { success: false, error: "Failed to fetch status history" },
        { status: 500 }
      );
    }

    // Format status history for timeline display
    const timeline = (statusHistory || []).map(entry => ({
      id: entry.id,
      status: entry.status,
      notes: entry.notes,
      timestamp: entry.createdAt,
      label: formatStatusLabel(entry.status),
    }));

    return NextResponse.json({
      success: true,
      estimate: {
        id: estimate.id,
        estimateNumber: estimate.estimateNumber,
        vehicle: `${estimate.vehicleYear} ${estimate.vehicleMake} ${estimate.vehicleModel}`,
        customerName: estimate.customerName,
      },
      currentStatus: estimate.status,
      currentStatusLabel: formatStatusLabel(estimate.status),
      estimatedCompletion: estimate.estimatedCompletion,
      timeline,
      payment: {
        totalAmount: estimate.totalAmount || 0,
        amountPaid: estimate.amountPaid || 0,
        paymentStatus: estimate.paymentStatus || "unpaid",
        depositRequired: estimate.depositRequired || null,
        depositPaid: estimate.depositPaid || false,
        balanceDue: (estimate.totalAmount || 0) - (estimate.amountPaid || 0),
      },
    });
  } catch (error) {
    console.error("Customer status fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to format status labels
function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: "Estimate Created",
    sent: "Estimate Sent",
    approved: "Estimate Approved",
    received: "Vehicle Received",
    in_progress: "Repair In Progress",
    waiting_for_parts: "Waiting for Parts",
    ready: "Ready for Pickup",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return labels[status] || status.replace(/_/g, " ").toUpperCase();
}
