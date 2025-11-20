import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function nanoid(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export const dynamic = "force-dynamic";

/**
 * POST - Adjust inventory quantity
 * Types: receive, sale, adjustment, reservation, return, damage, transfer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      inventoryItemId,
      type, // receive, sale, adjustment, etc.
      quantity, // Can be positive or negative
      reference, // PO number, estimate ID, etc.
      reason,
      notes,
      performedBy = "System",
    } = body;

    // Validate inputs
    if (!inventoryItemId || !type || quantity === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: inventoryItemId, type, quantity",
        },
        { status: 400 }
      );
    }

    // Get current inventory item
    const { data: item, error: fetchError } = await supabase
      .from("InventoryItem")
      .select("*")
      .eq("id", inventoryItemId)
      .single();

    if (fetchError || !item) {
      return NextResponse.json(
        { success: false, error: "Inventory item not found" },
        { status: 404 }
      );
    }

    const quantityBefore = item.quantityOnHand;
    const quantityAfter = quantityBefore + quantity;

    // Validate quantity won't go negative
    if (quantityAfter < 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot adjust quantity. Would result in negative stock (${quantityAfter})`,
        },
        { status: 400 }
      );
    }

    // Update inventory quantity
    const { data: updatedItem, error: updateError } = await supabase
      .from("InventoryItem")
      .update({
        quantityOnHand: quantityAfter,
        lastRestocked:
          quantity > 0 && type === "receive"
            ? new Date().toISOString()
            : item.lastRestocked,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", inventoryItemId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating inventory:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update inventory" },
        { status: 500 }
      );
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from("InventoryTransaction")
      .insert({
        id: nanoid(),
        inventoryItemId,
        type,
        quantity,
        quantityBefore,
        quantityAfter,
        reference,
        reason,
        notes,
        performedBy,
        performedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      // Don't fail the request, transaction log is supplementary
    }

    // Check for stock alerts
    const available = updatedItem.quantityOnHand - updatedItem.quantityReserved;

    // Create or resolve alerts
    if (available === 0) {
      // Out of stock alert
      const { data: existingAlert } = await supabase
        .from("StockAlert")
        .select("id")
        .eq("inventoryItemId", inventoryItemId)
        .eq("alertType", "out_of_stock")
        .eq("status", "active")
        .single();

      if (!existingAlert) {
        await supabase.from("StockAlert").insert({
          id: nanoid(),
          inventoryItemId,
          alertType: "out_of_stock",
          currentQuantity: available,
          threshold: updatedItem.reorderPoint,
          status: "active",
          createdAt: new Date().toISOString(),
        });
      }
    } else if (available <= updatedItem.reorderPoint) {
      // Low stock alert
      const { data: existingAlert } = await supabase
        .from("StockAlert")
        .select("id")
        .eq("inventoryItemId", inventoryItemId)
        .eq("alertType", "low_stock")
        .eq("status", "active")
        .single();

      if (!existingAlert) {
        await supabase.from("StockAlert").insert({
          id: nanoid(),
          inventoryItemId,
          alertType: "low_stock",
          currentQuantity: available,
          threshold: updatedItem.reorderPoint,
          status: "active",
          createdAt: new Date().toISOString(),
        });
      }
    } else if (available > updatedItem.reorderPoint) {
      // Resolve low stock and out of stock alerts
      await supabase
        .from("StockAlert")
        .update({
          status: "resolved",
          resolvedAt: new Date().toISOString(),
        })
        .eq("inventoryItemId", inventoryItemId)
        .in("alertType", ["low_stock", "out_of_stock"])
        .eq("status", "active");
    }

    return NextResponse.json({
      success: true,
      item: updatedItem,
      transaction,
      message: `Inventory adjusted: ${quantity > 0 ? "+" : ""}${quantity} units`,
    });
  } catch (error) {
    console.error("Inventory adjust error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
