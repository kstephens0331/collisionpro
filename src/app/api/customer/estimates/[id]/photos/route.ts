import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Get photos for customer's estimate
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
      .select("id")
      .eq("id", id)
      .eq("customerId", customerId)
      .single();

    if (estimateError || !estimate) {
      return NextResponse.json(
        { success: false, error: "Estimate not found or access denied" },
        { status: 404 }
      );
    }

    // Get photos
    const { data: photos, error } = await supabase
      .from("Photo")
      .select("id, url, category, caption, createdAt")
      .eq("estimateId", id)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching photos:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch photos" },
        { status: 500 }
      );
    }

    // Group photos by category for easier display
    const groupedPhotos = {
      damage: photos?.filter(p => p.category === "damage") || [],
      progress: photos?.filter(p => p.category === "progress") || [],
      completed: photos?.filter(p => p.category === "completed") || [],
    };

    return NextResponse.json({
      success: true,
      photos: photos || [],
      groupedPhotos,
      totalCount: photos?.length || 0,
    });
  } catch (error) {
    console.error("Customer photo fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
