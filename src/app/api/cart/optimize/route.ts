import { NextResponse } from "next/server";
import { SmartCartOptimizer, CartItem } from "@/lib/cart/SmartCartOptimizer";

/**
 * Smart Cart Optimization API
 *
 * POST /api/cart/optimize
 *
 * Body: {
 *   items: Array<{
 *     partId, partNumber, partName, quantity, weight?,
 *     availablePrices: Array<{ supplierId, supplierName, unitPrice, ... }>
 *   }>,
 *   taxRate?: number
 * }
 *
 * Returns optimized split of orders across suppliers for minimum total cost
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, taxRate } = body as { items: CartItem[]; taxRate?: number };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    // Validate that each item has available prices
    for (const item of items) {
      if (!item.availablePrices || item.availablePrices.length === 0) {
        return NextResponse.json(
          { error: `No prices available for ${item.partName}` },
          { status: 400 }
        );
      }
    }

    // Run optimization
    const optimizer = new SmartCartOptimizer(taxRate || 0.0825);
    const result = optimizer.optimize(items);

    return NextResponse.json({
      success: true,
      optimization: result,
      message: `Optimized ${items.length} parts across ${result.orders.length} suppliers`,
    });

  } catch (error: any) {
    console.error("Cart optimization error:", error);
    return NextResponse.json(
      { error: "Optimization failed", details: error.message },
      { status: 500 }
    );
  }
}
