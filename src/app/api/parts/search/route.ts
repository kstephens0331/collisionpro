import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");
    const category = searchParams.get("category");
    const sortBy = searchParams.get("sortBy") || "price"; // price, name, partNumber

    if (!query && !make && !category) {
      return NextResponse.json(
        { error: "Search query, make, or category required" },
        { status: 400 }
      );
    }

    // Build the query
    let partsQuery = supabaseAdmin
      .from('Part')
      .select(`
        *,
        prices:PartPrice(
          *,
          supplier:PartSupplier(*)
        ),
        crossReferences:PartCrossReference!aftermarketPartId(
          oemPart:Part!oemPartId(*)
        )
      `);

    // Apply filters
    if (query) {
      partsQuery = partsQuery.or(`name.ilike.%${query}%,partNumber.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (make) {
      partsQuery = partsQuery.ilike('make', `%${make}%`);
    }

    if (model) {
      partsQuery = partsQuery.ilike('model', `%${model}%`);
    }

    if (category) {
      partsQuery = partsQuery.eq('category', category);
    }

    if (year) {
      const yearNum = parseInt(year);
      partsQuery = partsQuery
        .lte('yearStart', yearNum)
        .gte('yearEnd', yearNum);
    }

    const { data: parts, error } = await partsQuery.limit(50);

    if (error) {
      console.error('Parts search error:', error);
      return NextResponse.json(
        { error: 'Failed to search parts', details: error.message },
        { status: 500 }
      );
    }

    // Transform and enrich the data
    const enrichedParts = parts?.map((part: any) => {
      // Get all available prices sorted by price
      const sortedPrices = (part.prices || [])
        .filter((p: any) => p.inStock)
        .sort((a: any, b: any) => a.price - b.price);

      const lowestPrice = sortedPrices[0]?.price || null;
      const highestPrice = sortedPrices[sortedPrices.length - 1]?.price || null;
      const averagePrice = sortedPrices.length > 0
        ? sortedPrices.reduce((sum: number, p: any) => sum + parseFloat(p.price), 0) / sortedPrices.length
        : null;

      return {
        ...part,
        priceRange: {
          lowest: lowestPrice,
          highest: highestPrice,
          average: averagePrice ? Math.round(averagePrice * 100) / 100 : null,
        },
        supplierCount: sortedPrices.length,
        inStockCount: sortedPrices.filter((p: any) => p.inStock).length,
        prices: sortedPrices, // Return sorted prices
      };
    });

    // Sort results
    let sortedParts = enrichedParts;
    if (sortBy === 'price') {
      sortedParts = enrichedParts.sort((a: any, b: any) =>
        (a.priceRange.lowest || 999999) - (b.priceRange.lowest || 999999)
      );
    } else if (sortBy === 'name') {
      sortedParts = enrichedParts.sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      );
    }

    return NextResponse.json({
      success: true,
      count: sortedParts.length,
      parts: sortedParts,
    });

  } catch (error: any) {
    console.error('Parts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
