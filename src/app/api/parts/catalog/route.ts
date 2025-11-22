/**
 * Parts Catalog API
 *
 * Search and browse the multi-supplier parts catalog
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchParts, type PartSearchFilters } from '@/lib/parts-catalog-service';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const filters: PartSearchFilters = {
      query: searchParams.get('query') || undefined,
      category: searchParams.get('category') || undefined,
      make: searchParams.get('make') || undefined,
      model: searchParams.get('model') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      condition: searchParams.getAll('condition') as any || undefined,
      qualityGrade: searchParams.getAll('qualityGrade') as any || undefined,
      priceMin: searchParams.get('priceMin') ? parseFloat(searchParams.get('priceMin')!) : undefined,
      priceMax: searchParams.get('priceMax') ? parseFloat(searchParams.get('priceMax')!) : undefined,
      availabilityStatus: searchParams.getAll('availabilityStatus') as any || undefined,
      supplierId: searchParams.get('supplierId') || undefined,
      inStock: searchParams.get('inStock') === 'true',
      sortBy: searchParams.get('sortBy') as any || 'relevance',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await searchParts(filters);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Parts catalog API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
