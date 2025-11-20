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
 * GET - Get all inventory items with optional filtering
 * Query params: category, lowStock (boolean), search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock") === "true";
    const search = searchParams.get("search");
    const shopId = searchParams.get("shopId") || "default";

    let query = supabase
      .from("InventoryItem")
      .select("*")
      .eq("shopId", shopId)
      .order("partName", { ascending: true });

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by low stock (quantityAvailable <= reorderPoint)
    if (lowStock) {
      query = query.lte("quantityAvailable", "reorderPoint");
    }

    // Search by part name or number
    if (search) {
      query = query.or(
        `partName.ilike.%${search}%,partNumber.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    const { data: items, error } = await query;

    if (error) {
      console.error("Error fetching inventory:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch inventory" },
        { status: 500 }
      );
    }

    // Get stock alerts for these items
    const itemIds = items.map((item) => item.id);
    const { data: alerts } = await supabase
      .from("StockAlert")
      .select("*")
      .in("inventoryItemId", itemIds)
      .eq("status", "active");

    // Attach alerts to items
    const itemsWithAlerts = items.map((item) => ({
      ...item,
      alerts: alerts?.filter((alert) => alert.inventoryItemId === item.id) || [],
    }));

    return NextResponse.json({
      success: true,
      items: itemsWithAlerts,
      count: items.length,
    });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a new inventory item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      partNumber,
      partName,
      description,
      category,
      manufacturer,
      isOEM,
      quantityOnHand,
      reorderPoint,
      reorderQuantity,
      minStockLevel,
      maxStockLevel,
      cost,
      retailPrice,
      wholesalePrice,
      location,
      barcode,
      preferredSupplierId,
      supplierPartNumber,
      leadTimeDays,
      vehicleMake,
      vehicleModel,
      vehicleYearStart,
      vehicleYearEnd,
      notes,
      shopId = "default",
    } = body;

    // Validate required fields
    if (!partNumber || !partName || !category) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: partNumber, partName, category",
        },
        { status: 400 }
      );
    }

    // Check if part number already exists for this shop
    const { data: existing } = await supabase
      .from("InventoryItem")
      .select("id")
      .eq("shopId", shopId)
      .eq("partNumber", partNumber)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: `Part number ${partNumber} already exists in inventory`,
        },
        { status: 409 }
      );
    }

    // Create inventory item
    const itemId = nanoid();
    const { data: item, error: itemError } = await supabase
      .from("InventoryItem")
      .insert({
        id: itemId,
        shopId,
        partNumber,
        partName,
        description,
        category,
        manufacturer,
        isOEM: isOEM || false,
        quantityOnHand: quantityOnHand || 0,
        quantityReserved: 0,
        reorderPoint: reorderPoint || 2,
        reorderQuantity: reorderQuantity || 5,
        minStockLevel: minStockLevel || 1,
        maxStockLevel,
        cost: cost || 0,
        retailPrice: retailPrice || 0,
        wholesalePrice,
        location,
        barcode,
        preferredSupplierId,
        supplierPartNumber,
        leadTimeDays: leadTimeDays || 3,
        vehicleMake,
        vehicleModel,
        vehicleYearStart,
        vehicleYearEnd,
        notes,
        lastRestocked: quantityOnHand > 0 ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (itemError) {
      console.error("Error creating inventory item:", itemError);
      return NextResponse.json(
        { success: false, error: "Failed to create inventory item" },
        { status: 500 }
      );
    }

    // Create initial transaction if quantity > 0
    if (quantityOnHand > 0) {
      await supabase.from("InventoryTransaction").insert({
        id: nanoid(),
        inventoryItemId: itemId,
        type: "receive",
        quantity: quantityOnHand,
        quantityBefore: 0,
        quantityAfter: quantityOnHand,
        reason: "Initial stock",
        performedBy: "System",
        performedAt: new Date().toISOString(),
      });
    }

    // Check if we need to create a low stock alert
    if (quantityOnHand <= reorderPoint) {
      await supabase.from("StockAlert").insert({
        id: nanoid(),
        inventoryItemId: itemId,
        alertType: quantityOnHand === 0 ? "out_of_stock" : "low_stock",
        currentQuantity: quantityOnHand,
        threshold: reorderPoint,
        status: "active",
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      item,
      message: "Inventory item created successfully",
    });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update an inventory item
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Update the item
    const { data: item, error: updateError } = await supabase
      .from("InventoryItem")
      .update({
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating inventory item:", updateError);
      return NextResponse.json(
        { success: false, error: "Failed to update inventory item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      item,
      message: "Inventory item updated successfully",
    });
  } catch (error) {
    console.error("Inventory PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete an inventory item
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from("InventoryItem")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting inventory item:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete inventory item" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    console.error("Inventory DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
