import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }

    // Fetch estimates for this customer
    const { data: estimates, error } = await supabase
      .from("Estimate")
      .select("*")
      .eq("customerId", customerId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching estimates:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch estimates" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      estimates: estimates || [],
    });
  } catch (error) {
    console.error("Customer estimates error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
