import { NextRequest, NextResponse } from 'next/server';
import { extractSupplementPatterns } from '@/lib/supplements/pattern-analyzer';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Get supplement patterns
 * GET /api/supplements/patterns
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleMake = searchParams.get('vehicleMake');
    const vehicleModel = searchParams.get('vehicleModel');
    const limit = parseInt(searchParams.get('limit') || '50');
    const minConfidence = parseInt(searchParams.get('minConfidence') || '0');

    let query = supabaseAdmin
      .from('supplement_patterns')
      .select('*')
      .gte('confidence_score', minConfidence)
      .order('confidence_score', { ascending: false })
      .limit(limit);

    if (vehicleMake) {
      query = query.eq('vehicle_make', vehicleMake);
    }
    if (vehicleModel) {
      query = query.eq('vehicle_model', vehicleModel);
    }

    const { data: patterns, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch patterns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        patterns: patterns || [],
        count: patterns?.length || 0,
      },
    });
  } catch (error) {
    console.error('Get patterns error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patterns',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Extract patterns from historical data (admin/background job)
 * POST /api/supplements/patterns
 */
export async function POST(request: NextRequest) {
  try {
    const result = await extractSupplementPatterns();

    return NextResponse.json({
      success: result.success,
      data: {
        patternsCreated: result.patternsCreated,
        patternsUpdated: result.patternsUpdated,
        message: `Pattern extraction complete. Created: ${result.patternsCreated}, Updated: ${result.patternsUpdated}`,
      },
    });
  } catch (error) {
    console.error('Pattern extraction error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to extract patterns',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
