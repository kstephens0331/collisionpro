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

// GET - Get orderable parts from estimate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get all part-type line items that haven't been ordered
    const { data: items, error } = await supabase
      .from("EstimateLineItem")
      .select("*")
      .eq("estimateId", id)
      .eq("type", "part")
      .in("orderStatus", ["not_ordered", null]);

    if (error) {
      console.error("Error fetching line items:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch line items" },
        { status: 500 }
      );
    }

    // Get estimate for shop ID
    const { data: estimate } = await supabase
      .from("Estimate")
      .select("shopId")
      .eq("id", id)
      .single();

    // Get shop's suppliers
    const { data: suppliers } = await supabase
      .from("PartsSupplier")
      .select("*")
      .eq("shopId", estimate?.shopId || "")
      .eq("isActive", true)
      .order("isPrimary", { ascending: false });

    return NextResponse.json({
      success: true,
      items: items || [],
      suppliers: suppliers || [],
    });
  } catch (error) {
    console.error("Order parts fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create parts order from estimate line items
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { supplierId, itemIds, notes } = body;

    if (!supplierId || !itemIds || itemIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Supplier ID and item IDs are required" },
        { status: 400 }
      );
    }

    // Get estimate for shop ID
    const { data: estimate } = await supabase
      .from("Estimate")
      .select("shopId")
      .eq("id", id)
      .single();

    if (!estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found" },
        { status: 404 }
      );
    }

    // Get the line items to order
    const { data: items, error: itemsError } = await supabase
      .from("EstimateLineItem")
      .select("*")
      .in("id", itemIds);

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid items found" },
        { status: 400 }
      );
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItems = items.map((item) => {
      const unitCost = item.costPrice || item.unitPrice || 0;
      const quantity = item.quantity || 1;
      const itemTotal = quantity * unitCost;
      totalAmount += itemTotal;

      return {
        id: nanoid(),
        partNumber: item.partNumber || item.partId || "N/A",
        description: item.partName,
        quantity,
        unitCost,
        totalCost: itemTotal,
        lineItemId: item.id,
        coreCharge: 0,
        notes: null,
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
      shopId: estimate.shopId,
      supplierId,
      estimateId: id,
      orderNumber,
      poNumber: null,
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
    const itemsWithOrderId = orderItems.map((item) => ({
      ...item,
      orderId,
    }));

    const { error: insertError } = await supabase
      .from("PartsOrderItem")
      .insert(itemsWithOrderId);

    if (insertError) {
      console.error("Error creating order items:", insertError);
      // Rollback order
      await supabase.from("PartsOrder").delete().eq("id", orderId);
      return NextResponse.json(
        { success: false, error: "Failed to create order items" },
        { status: 500 }
      );
    }

    // Update EstimateLineItem order status
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
      message: `Parts order created with ${orderItems.length} items`,
    });
  } catch (error) {
    console.error("Order parts creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
