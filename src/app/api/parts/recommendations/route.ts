/**
 * Parts Recommendations API
 *
 * AI-powered smart part recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateRecommendations,
  getRecommendationsForEstimate,
  recordRecommendationFeedback,
  type VehicleInfo,
  type DamageInfo,
  type RecommendationOptions,
} from '@/lib/parts-recommendation-engine';

// POST - Generate recommendations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { estimateId, vehicle, damage, options } = body;

    if (!estimateId || !vehicle || !damage) {
      return NextResponse.json(
        { error: 'estimateId, vehicle, and damage are required' },
        { status: 400 }
      );
    }

    const vehicleInfo: VehicleInfo = {
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      vin: vehicle.vin,
    };

    const damageInfo: DamageInfo = {
      type: damage.type,
      severity: damage.severity || 'moderate',
      affectedAreas: damage.affectedAreas || [],
      description: damage.description,
    };

    const recommendationOptions: RecommendationOptions = options || {};

    const recommendations = await generateRecommendations(
      estimateId,
      vehicleInfo,
      damageInfo,
      recommendationOptions
    );

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET - Get existing recommendations for an estimate
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const estimateId = searchParams.get('estimateId');

    if (!estimateId) {
      return NextResponse.json(
        { error: 'estimateId is required' },
        { status: 400 }
      );
    }

    const recommendations = await getRecommendationsForEstimate(estimateId);

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Record feedback on recommendation
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { recommendationId, selected, feedback } = body;

    if (!recommendationId || selected === undefined) {
      return NextResponse.json(
        { error: 'recommendationId and selected are required' },
        { status: 400 }
      );
    }

    await recordRecommendationFeedback(recommendationId, selected, feedback);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Recommendation feedback error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
