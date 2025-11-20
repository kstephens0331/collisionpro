import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateRecommendations } from '@/lib/supplements/recommendation-engine';
import type { EstimateContext } from '@/lib/supplements/types';

export const dynamic = 'force-dynamic';

/**
 * Get supplement recommendations for an estimate
 * GET /api/supplements/recommendations?estimateId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const estimateId = searchParams.get('estimateId');
    const minConfidence = parseInt(searchParams.get('minConfidence') || '50');
    const includePreDisassembly = searchParams.get('includePreDisassembly') !== 'false';
    const includeDuringRepair = searchParams.get('includeDuringRepair') !== 'false';

    if (!estimateId) {
      return NextResponse.json(
        { success: false, error: 'Missing estimateId parameter' },
        { status: 400 }
      );
    }

    // Fetch estimate with all related data
    const { data: estimate, error: fetchError } = await supabaseAdmin
      .from('estimates')
      .select(`
        id,
        total,
        vehicle_make,
        vehicle_model,
        vehicle_year,
        vin,
        damage_description,
        insurance_company,
        insurance_external_id,
        items:estimate_items (
          id,
          type,
          description,
          quantity,
          unit_price,
          total,
          category
        )
      `)
      .eq('id', estimateId)
      .single();

    if (fetchError || !estimate) {
      return NextResponse.json(
        { success: false, error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Count photos
    const { count: photoCount } = await supabaseAdmin
      .from('estimate_photos')
      .select('*', { count: 'exact', head: true })
      .eq('estimate_id', estimateId);

    // Build estimate context
    const context: EstimateContext = {
      id: estimate.id,
      total: estimate.total || 0,
      vehicleMake: estimate.vehicle_make || '',
      vehicleModel: estimate.vehicle_model || '',
      vehicleYear: estimate.vehicle_year || new Date().getFullYear(),
      vin: estimate.vin,
      damageDescription: estimate.damage_description,
      items: (estimate.items || []).map((item: any) => ({
        id: item.id,
        type: item.type || 'other',
        description: item.description || '',
        quantity: item.quantity || 0,
        unitPrice: item.unit_price || 0,
        total: item.total || 0,
        category: item.category,
      })),
      photoCount: photoCount || 0,
      insuranceCompany: estimate.insurance_company,
      hasInsuranceSubmission: !!estimate.insurance_external_id,
    };

    // Generate recommendations
    const recommendations = await generateRecommendations(context, {
      includePreDisassembly,
      includeDuringRepair,
      minConfidence,
    });

    // Calculate summary stats
    const totalCount = recommendations.length;
    const highPriorityCount = recommendations.filter((r) => r.priority === 'high').length;
    const estimatedTotalAmount = recommendations.reduce((sum, r) => sum + (r.suggestedAmount || 0), 0);
    const avgConfidence = totalCount > 0
      ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / totalCount
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalCount,
        highPriorityCount,
        estimatedTotalAmount,
        avgConfidence: Math.round(avgConfidence),
      },
    });
  } catch (error) {
    console.error('Recommendation generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Create a supplement recommendation record
 * POST /api/supplements/recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      estimateId,
      shopId,
      trigger,
      category,
      confidence,
      suggestedAmount,
      justification,
      documentationNeeded,
      relatedPatterns,
    } = body;

    if (!estimateId || !shopId || !trigger || !category || confidence === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['estimateId', 'shopId', 'trigger', 'category', 'confidence'],
        },
        { status: 400 }
      );
    }

    // Create recommendation record
    const { data: recommendation, error: insertError } = await supabaseAdmin
      .from('supplement_recommendations')
      .insert({
        estimate_id: estimateId,
        shop_id: shopId,
        trigger,
        category,
        confidence,
        suggested_amount: suggestedAmount || null,
        justification: justification || null,
        documentation_needed: documentationNeeded || [],
        related_patterns: JSON.stringify(relatedPatterns || []),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { success: false, error: 'Failed to create recommendation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    console.error('Create recommendation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create recommendation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
