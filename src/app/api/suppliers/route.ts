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

// GET - List suppliers for a shop
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

    const { data: suppliers, error } = await supabase
      .from("PartsSupplier")
      .select("*")
      .eq("shopId", shopId)
      .order("isPrimary", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching suppliers:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch suppliers" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      suppliers: suppliers || [],
    });
  } catch (error) {
    console.error("Suppliers fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopId,
      name,
      type,
      accountNumber,
      apiKey,
      apiEndpoint,
      contactName,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      zipCode,
      discountPercentage,
      defaultMarkup,
      deliveryDays,
      isPrimary,
      notes,
    } = body;

    if (!shopId || !name || !type) {
      return NextResponse.json(
        { success: false, error: "Shop ID, name, and type are required" },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary suppliers
    if (isPrimary) {
      await supabase
        .from("PartsSupplier")
        .update({ isPrimary: false })
        .eq("shopId", shopId);
    }

    const supplierId = nanoid();
    const { error } = await supabase.from("PartsSupplier").insert({
      id: supplierId,
      shopId,
      name,
      type,
      accountNumber: accountNumber || null,
      apiKey: apiKey || null,
      apiEndpoint: apiEndpoint || null,
      contactName: contactName || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zipCode: zipCode || null,
      discountPercentage: discountPercentage || 0,
      defaultMarkup: defaultMarkup || 30,
      deliveryDays: deliveryDays || 1,
      isActive: true,
      isPrimary: isPrimary || false,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating supplier:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create supplier" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supplierId,
      message: "Supplier created successfully",
    });
  } catch (error) {
    console.error("Supplier creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update a supplier
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, shopId, isPrimary, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primary suppliers
    if (isPrimary && shopId) {
      await supabase
        .from("PartsSupplier")
        .update({ isPrimary: false })
        .eq("shopId", shopId)
        .neq("id", id);
    }

    const { error } = await supabase
      .from("PartsSupplier")
      .update({
        ...updateData,
        isPrimary: isPrimary || false,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Error updating supplier:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update supplier" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supplier updated successfully",
    });
  } catch (error) {
    console.error("Supplier update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a supplier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Supplier ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("PartsSupplier")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting supplier:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete supplier" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Supplier deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
