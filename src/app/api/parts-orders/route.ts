import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate unique ID
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// GET - List parts orders for a shop
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const status = searchParams.get("status");
    const estimateId = searchParams.get("estimateId");

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: "Shop ID is required" },
        { status: 400 }
      );
    }

    let query = supabase
      .from("PartsOrder")
      .select(`
        *,
        PartsSupplier:supplierId(id, name, type),
        Estimate:estimateId(id, estimateNumber, vehicleYear, vehicleMake, vehicleModel),
        PartsOrderItem(*)
      `)
      .eq("shopId", shopId)
      .order("createdAt", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (estimateId) {
      query = query.eq("estimateId", estimateId);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error("Error fetching parts orders:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch parts orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orders: orders || [],
    });
  } catch (error) {
    console.error("Parts orders fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new parts order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      supplierId,
      estimateId,
      poNumber,
      items,
      notes,
    } = body;

    if (!shopId || !supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Shop ID, supplier ID, and items are required" },
        { status: 400 }
      );
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItems = items.map((item: {
      partNumber: string;
      description: string;
      quantity: number;
      unitCost: number;
      lineItemId?: string;
      coreCharge?: number;
      notes?: string;
    }) => {
      const itemTotal = item.quantity * item.unitCost;
      totalAmount += itemTotal + (item.coreCharge || 0);
      return {
        id: nanoid(),
        partNumber: item.partNumber,
        description: item.description,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: itemTotal,
        lineItemId: item.lineItemId || null,
        coreCharge: item.coreCharge || 0,
        notes: item.notes || null,
        createdAt: new Date().toISOString(),
      };
    });

    // Generate order number
    const timestamp = Date.now().toString(36).toUpperCase();
    const orderNumber = `PO-${timestamp}`;

    // Create order
    const orderId = nanoid();
    const { error: orderError } = await supabase.from("PartsOrder").insert({
      id: orderId,
      shopId,
      supplierId,
      estimateId: estimateId || null,
      orderNumber,
      poNumber: poNumber || null,
      status: "pending",
      totalAmount,
      shippingCost: 0,
      taxAmount: 0,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (orderError) {
      console.error("Error creating parts order:", orderError);
      return NextResponse.json(
        { success: false, error: "Failed to create parts order" },
        { status: 500 }
      );
    }

    // Add order ID to items and insert
    const itemsWithOrderId = orderItems.map((item: {
      id: string;
      partNumber: string;
      description: string;
      quantity: number;
      unitCost: number;
      totalCost: number;
      lineItemId: string | null;
      coreCharge: number;
      notes: string | null;
      createdAt: string;
    }) => ({
      ...item,
      orderId,
    }));

    const { error: itemsError } = await supabase
      .from("PartsOrderItem")
      .insert(itemsWithOrderId);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      // Rollback order
      await supabase.from("PartsOrder").delete().eq("id", orderId);
      return NextResponse.json(
        { success: false, error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Update EstimateLineItem order status if linked
    for (const item of orderItems) {
      if (item.lineItemId) {
        await supabase
          .from("EstimateLineItem")
          .update({
            orderStatus: "ordered",
            supplierId,
          })
          .eq("id", item.lineItemId);
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      message: "Parts order created successfully",
    });
  } catch (error) {
    console.error("Parts order creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a parts order
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      trackingNumber,
      expectedDelivery,
      actualDelivery,
      shippingCost,
      taxAmount,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (status !== undefined) {
      updateData.status = status;

      // Update timestamps based on status
      switch (status) {
        case "submitted":
          updateData.submittedAt = new Date().toISOString();
          break;
        case "confirmed":
          updateData.confirmedAt = new Date().toISOString();
          break;
        case "shipped":
          updateData.shippedAt = new Date().toISOString();
          break;
        case "delivered":
          updateData.deliveredAt = new Date().toISOString();
          updateData.actualDelivery = new Date().toISOString().split("T")[0];
          break;
      }
    }

    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (expectedDelivery !== undefined) updateData.expectedDelivery = expectedDelivery;
    if (actualDelivery !== undefined) updateData.actualDelivery = actualDelivery;
    if (shippingCost !== undefined) updateData.shippingCost = shippingCost;
    if (taxAmount !== undefined) updateData.taxAmount = taxAmount;
    if (notes !== undefined) updateData.notes = notes;

    const { error } = await supabase
      .from("PartsOrder")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating parts order:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update parts order" },
        { status: 500 }
      );
    }

    // If delivered, update linked EstimateLineItems
    if (status === "delivered") {
      const { data: orderItems } = await supabase
        .from("PartsOrderItem")
        .select("lineItemId")
        .eq("orderId", id);

      if (orderItems) {
        for (const item of orderItems) {
          if (item.lineItemId) {
            await supabase
              .from("EstimateLineItem")
              .update({ orderStatus: "received" })
              .eq("id", item.lineItemId);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Parts order updated successfully",
    });
  } catch (error) {
    console.error("Parts order update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/delete a parts order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order items to reset EstimateLineItem status
    const { data: orderItems } = await supabase
      .from("PartsOrderItem")
      .select("lineItemId")
      .eq("orderId", id);

    // Reset EstimateLineItem order status
    if (orderItems) {
      for (const item of orderItems) {
        if (item.lineItemId) {
          await supabase
            .from("EstimateLineItem")
            .update({
              orderStatus: "not_ordered",
              supplierId: null,
            })
            .eq("id", item.lineItemId);
        }
      }
    }

    // Delete order (items will cascade delete)
    const { error } = await supabase
      .from("PartsOrder")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting parts order:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete parts order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Parts order deleted successfully",
    });
  } catch (error) {
    console.error("Parts order deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
