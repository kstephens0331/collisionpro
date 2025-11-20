import { NextRequest, NextResponse } from 'next/server';
import {
  scrapeRockAutoParts,
  searchPartsByKeyword,
  VehicleInfo,
  COLLISION_CATEGORIES,
} from '@/lib/scrapers/rockauto';

export const dynamic = 'force-dynamic';

/**
 * RockAuto Scraper API - Proof of Concept
 *
 * GET /api/scrapers/rockauto?year=2020&make=Toyota&model=Camry&category=bumper
 * GET /api/scrapers/rockauto?keyword=52119-06420
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Search by keyword (part number)
  const keyword = searchParams.get('keyword');
  if (keyword) {
    const results = await searchPartsByKeyword(keyword);
    return NextResponse.json({
      success: true,
      data: results,
      source: 'rockauto',
      disclaimer: 'This is a proof of concept. For production use, integrate with PartsTech API.',
    });
  }

  // Search by vehicle
  const year = searchParams.get('year');
  const make = searchParams.get('make');
  const model = searchParams.get('model');
  const category = searchParams.get('category') || 'bumper';

  if (!year || !make || !model) {
    return NextResponse.json(
      {
        success: false,
        error: 'Missing required parameters: year, make, model',
        example: '/api/scrapers/rockauto?year=2020&make=Toyota&model=Camry&category=bumper',
        availableCategories: Object.keys(COLLISION_CATEGORIES),
      },
      { status: 400 }
    );
  }

  const vehicle: VehicleInfo = {
    year: parseInt(year),
    make,
    model,
    engine: searchParams.get('engine') || undefined,
  };

  try {
    const results = await scrapeRockAutoParts(vehicle, category);

    return NextResponse.json({
      success: true,
      data: results,
      source: 'rockauto',
      url: `Generated from RockAuto catalog`,
      disclaimer: 'This is a proof of concept. For production use, integrate with PartsTech API.',
    });
  } catch (error) {
    console.error('Scraper error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to scrape parts data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scrapers/rockauto
 * Body: { vehicle: VehicleInfo, categories: string[] }
 *
 * Fetch parts for multiple categories at once
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vehicle, categories = ['bumper'] } = body as {
      vehicle: VehicleInfo;
      categories: string[];
    };

    if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid vehicle data',
          required: { year: 'number', make: 'string', model: 'string' },
        },
        { status: 400 }
      );
    }

    // Fetch parts for all categories in parallel
    const results = await Promise.all(
      categories.map((category) => scrapeRockAutoParts(vehicle, category))
    );

    // Combine results
    const allParts = results.flatMap((r) => r.parts);
    const uniqueParts = allParts.reduce(
      (acc, part) => {
        if (!acc.seen.has(part.partNumber)) {
          acc.seen.add(part.partNumber);
          acc.parts.push(part);
        }
        return acc;
      },
      { seen: new Set<string>(), parts: [] as typeof allParts }
    ).parts;

    return NextResponse.json({
      success: true,
      data: {
        parts: uniqueParts,
        totalCount: uniqueParts.length,
        categories: categories,
        vehicle,
      },
      source: 'rockauto',
      disclaimer: 'This is a proof of concept. For production use, integrate with PartsTech API.',
    });
  } catch (error) {
    console.error('Scraper POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
