import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// PUT - Update order item (mark received, update status)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      receivedQuantity,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status !== undefined) updateData.status = status;
    if (receivedQuantity !== undefined) updateData.receivedQuantity = receivedQuantity;
    if (notes !== undefined) updateData.notes = notes;

    const { data: item, error } = await supabase
      .from("PartsOrderItem")
      .update(updateData)
      .eq("id", id)
      .select("lineItemId, status")
      .single();

    if (error) {
      console.error("Error updating order item:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update order item" },
        { status: 500 }
      );
    }

    // Update linked EstimateLineItem status if received
    if (item?.lineItemId && status === "received") {
      await supabase
        .from("EstimateLineItem")
        .update({ orderStatus: "received" })
        .eq("id", item.lineItemId);
    }

    return NextResponse.json({
      success: true,
      message: "Order item updated successfully",
    });
  } catch (error) {
    console.error("Order item update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
