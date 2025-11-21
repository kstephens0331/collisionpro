import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getTaxSettingsForState } from "@/lib/tax";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/shop-settings/tax?shopId=xxx
 * Get tax settings for a shop
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId parameter required" },
        { status: 400 }
      );
    }

    // Try to get existing tax settings
    const { data: taxSettings, error } = await supabaseAdmin
      .from("ShopTaxSettings")
      .select("*")
      .eq("shopId", shopId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" which is okay
      throw error;
    }

    // If no settings exist, return defaults
    if (!taxSettings) {
      return NextResponse.json({
        success: true,
        data: {
          taxRate: 0,
          taxableParts: true,
          taxableLabor: false,
          shopSuppliesRate: 0.05,
          environmentalFeeAmount: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: taxSettings,
    });
  } catch (error) {
    console.error("Error fetching tax settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/shop-settings/tax
 * Create or update tax settings
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shopId,
      taxRate,
      taxableParts,
      taxableLabor,
      shopSuppliesRate,
      environmentalFeeAmount,
      state,
      county,
      city,
      zipCode,
    } = body;

    if (!shopId) {
      return NextResponse.json(
        { error: "shopId is required" },
        { status: 400 }
      );
    }

    // Validate tax rate
    if (taxRate < 0 || taxRate > 0.2) {
      return NextResponse.json(
        { error: "Tax rate must be between 0% and 20%" },
        { status: 400 }
      );
    }

    // Upsert tax settings
    const { data, error } = await supabaseAdmin
      .from("ShopTaxSettings")
      .upsert({
        shopId,
        taxRate,
        taxableParts,
        taxableLabor,
        shopSuppliesRate,
        environmentalFeeAmount: environmentalFeeAmount || 0,
        state,
        county,
        city,
        zipCode,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error updating tax settings:", error);
    return NextResponse.json(
      { error: "Failed to update tax settings" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shop-settings/tax/state-defaults?state=TX
 * Get tax defaults for a state
 */
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json(
        { error: "State parameter required" },
        { status: 400 }
      );
    }

    const defaults = getTaxSettingsForState(state);

    return NextResponse.json({
      success: true,
      data: defaults,
    });
  } catch (error) {
    console.error("Error fetching state tax defaults:", error);
    return NextResponse.json(
      { error: "Failed to fetch state defaults" },
      { status: 500 }
    );
  }
}
