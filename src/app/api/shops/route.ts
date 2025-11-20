import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, getUniqueSlug } from "@/lib/tenant";

// Generate unique ID
function nanoid(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// GET - List all shops (admin only) or get shop by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug) {
      // Get specific shop by slug
      const { data: shop, error } = await supabaseAdmin
        .from("Shop")
        .select("id, name, slug, createdAt")
        .eq("slug", slug)
        .single();

      if (error || !shop) {
        return NextResponse.json(
          { success: false, error: "Shop not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, shop });
    }

    // List all shops (paginated)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const { data: shops, error, count } = await supabaseAdmin
      .from("Shop")
      .select("id, name, slug, createdAt", { count: "exact" })
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching shops:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch shops" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shops: shops || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Shops fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new shop (dealer onboarding)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zip,
      ownerName,
      ownerEmail,
      ownerPassword,
    } = body;

    // Validate required fields
    if (!name || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        { success: false, error: "Shop name, owner email, and password are required" },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = await getUniqueSlug(name);

    // Create shop
    const shopId = nanoid();
    const { error: shopError } = await supabaseAdmin.from("Shop").insert({
      id: shopId,
      name,
      slug,
      email: email || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (shopError) {
      console.error("Error creating shop:", shopError);
      return NextResponse.json(
        { success: false, error: "Failed to create shop" },
        { status: 500 }
      );
    }

    // Create owner user
    const userId = nanoid();
    const { error: userError } = await supabaseAdmin.from("User").insert({
      id: userId,
      shopId,
      email: ownerEmail,
      name: ownerName || "Shop Owner",
      role: "owner",
      password: ownerPassword, // Note: Should be hashed in production
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (userError) {
      console.error("Error creating owner user:", userError);
      // Rollback shop creation
      await supabaseAdmin.from("Shop").delete().eq("id", shopId);
      return NextResponse.json(
        { success: false, error: "Failed to create owner account" },
        { status: 500 }
      );
    }

    // Create default shop settings
    const { error: settingsError } = await supabaseAdmin.from("ShopSettings").insert({
      id: nanoid(),
      shopId,
      shopName: name,
      laborRate: 65.00,
      paintLaborRate: 65.00,
      bodyLaborRate: 65.00,
      frameLaborRate: 75.00,
      mechanicalLaborRate: 85.00,
      taxRate: 0.0825, // Default 8.25%
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (settingsError) {
      console.error("Error creating shop settings:", settingsError);
      // Non-critical, continue
    }

    return NextResponse.json({
      success: true,
      shop: {
        id: shopId,
        name,
        slug,
      },
      user: {
        id: userId,
        email: ownerEmail,
      },
      message: `Shop created successfully. Access your dashboard at /${slug}/dashboard`,
    });
  } catch (error) {
    console.error("Shop creation error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update shop details
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug: newSlug, email, phone, address, city, state, zip } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Shop ID is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zip !== undefined) updateData.zip = zip;

    // Handle slug change
    if (newSlug) {
      // Verify slug is available
      const { data: existing } = await supabaseAdmin
        .from("Shop")
        .select("id")
        .eq("slug", newSlug)
        .neq("id", id)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, error: "Slug is already taken" },
          { status: 400 }
        );
      }

      updateData.slug = newSlug;
    }

    const { error } = await supabaseAdmin
      .from("Shop")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating shop:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update shop" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Shop updated successfully",
    });
  } catch (error) {
    console.error("Shop update error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
