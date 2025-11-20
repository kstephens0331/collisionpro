import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/damage-annotations
 * Save damage annotations for an estimate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { estimateId, vehicleType, markers, cameraPosition } = body;

    // Validation
    if (!estimateId) {
      return NextResponse.json(
        { success: false, error: 'estimateId is required' },
        { status: 400 }
      );
    }

    if (!markers || !Array.isArray(markers)) {
      return NextResponse.json(
        { success: false, error: 'markers must be an array' },
        { status: 400 }
      );
    }

    // Check if annotation already exists for this estimate
    const { data: existing } = await supabaseAdmin
      .from('DamageAnnotation')
      .select('id')
      .eq('estimateId', estimateId)
      .single();

    let result;

    if (existing) {
      // Update existing annotation
      const { data, error } = await supabaseAdmin
        .from('DamageAnnotation')
        .update({
          vehicleType: vehicleType || 'sedan',
          markers,
          cameraPosition: cameraPosition || null,
          updatedAt: new Date().toISOString(),
        })
        .eq('estimateId', estimateId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new annotation
      const id = `dmg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { data, error } = await supabaseAdmin
        .from('DamageAnnotation')
        .insert({
          id,
          estimateId: estimateId,
          vehicleType: vehicleType || 'sedan',
          markers,
          cameraPosition: cameraPosition || null,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error saving damage annotations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/damage-annotations?estimateId=xxx
 * Load damage annotations for an estimate
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estimateId = searchParams.get('estimateId');

    if (!estimateId) {
      return NextResponse.json(
        { success: false, error: 'estimateId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('DamageAnnotation')
      .select('*')
      .eq('estimateId', estimateId)
      .single();

    if (error) {
      // If no annotation found, return empty state
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          data: {
            estimateId,
            vehicleType: 'sedan',
            markers: [],
            cameraPosition: null,
          },
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data.id,
        estimateId: data.estimateId,
        vehicleType: data.vehicleType,
        markers: data.markers,
        cameraPosition: data.cameraPosition,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error loading damage annotations:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
