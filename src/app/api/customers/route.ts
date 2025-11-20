import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - List customers for a shop (derived from estimates)
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

    // Fetch all estimates for the shop to derive customer data
    const { data: estimates, error } = await supabase
      .from("Estimate")
      .select("*")
      .eq("shopId", shopId)
      .order("createdAt", { ascending: false });

    if (error) {
      console.error("Error fetching estimates:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch customers" },
        { status: 500 }
      );
    }

    // Group estimates by customer email (or name if no email)
    const customerMap = new Map<string, {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      estimateCount: number;
      totalSpent: number;
      lastVisit: string;
      vehicles: { year: number; make: string; model: string }[];
    }>();

    for (const estimate of estimates || []) {
      const key = estimate.customerEmail || estimate.customerName || "Unknown";

      if (customerMap.has(key)) {
        const customer = customerMap.get(key)!;
        customer.estimateCount += 1;
        customer.totalSpent += estimate.total || 0;

        // Add vehicle if not already in list
        const vehicleKey = `${estimate.vehicleYear}-${estimate.vehicleMake}-${estimate.vehicleModel}`;
        const hasVehicle = customer.vehicles.some(
          v => `${v.year}-${v.make}-${v.model}` === vehicleKey
        );
        if (!hasVehicle && estimate.vehicleYear && estimate.vehicleMake && estimate.vehicleModel) {
          customer.vehicles.push({
            year: estimate.vehicleYear,
            make: estimate.vehicleMake,
            model: estimate.vehicleModel,
          });
        }

        // Update last visit if more recent
        if (new Date(estimate.createdAt) > new Date(customer.lastVisit)) {
          customer.lastVisit = estimate.createdAt;
        }
      } else {
        customerMap.set(key, {
          id: estimate.id, // Use first estimate ID as customer ID
          name: estimate.customerName || "Unknown",
          email: estimate.customerEmail || "",
          phone: estimate.customerPhone || "",
          address: estimate.customerAddress || "",
          estimateCount: 1,
          totalSpent: estimate.total || 0,
          lastVisit: estimate.createdAt,
          vehicles: estimate.vehicleYear && estimate.vehicleMake && estimate.vehicleModel
            ? [{
                year: estimate.vehicleYear,
                make: estimate.vehicleMake,
                model: estimate.vehicleModel,
              }]
            : [],
        });
      }
    }

    // Convert map to array and sort by total spent
    const customers = Array.from(customerMap.values()).sort(
      (a, b) => b.totalSpent - a.totalSpent
    );

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error("Customers fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
