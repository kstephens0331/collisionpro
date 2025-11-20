import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Submit supplement to insurance
 * POST /api/insurance/supplement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { estimateId, reason, items, totalAmount } = body;

    // Validate required fields
    if (!estimateId || !reason || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['estimateId', 'reason', 'items'],
        },
        { status: 400 }
      );
    }

    // Get estimate and insurance submission info
    const { data: estimate, error: fetchError } = await supabaseAdmin
      .from('estimates')
      .select('*, shop:shops(*)')
      .eq('id', estimateId)
      .single();

    if (fetchError || !estimate) {
      return NextResponse.json(
        { success: false, error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Check if estimate has been submitted to insurance
    if (!estimate.insurance_external_id || !estimate.insurance_platform) {
      return NextResponse.json(
        {
          success: false,
          error: 'Estimate has not been submitted to insurance yet',
        },
        { status: 400 }
      );
    }

    // Create supplement record
    const supplementId = `SUPP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Update estimate to track supplement
    await supabaseAdmin
      .from('estimates')
      .update({
        has_active_supplement: true,
        supplement_reason: reason,
        supplement_amount: totalAmount,
        supplement_submitted_at: new Date().toISOString(),
        supplement_status: 'submitted',
      })
      .eq('id', estimateId);

    return NextResponse.json({
      success: true,
      data: {
        supplementId,
        estimateId,
        status: 'submitted',
        reason,
        itemCount: items.length,
        totalAmount,
        message: 'Supplement submitted successfully (Demo Mode)',
        note: 'In production, this would be sent to the insurance platform',
        submittedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Supplement submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit supplement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get supplements for an estimate
 * GET /api/insurance/supplement?estimateId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const estimateId = searchParams.get('estimateId');

    if (!estimateId) {
      return NextResponse.json(
        { success: false, error: 'Missing estimateId parameter' },
        { status: 400 }
      );
    }

    const { data: estimate, error } = await supabaseAdmin
      .from('estimates')
      .select(`
        id,
        has_active_supplement,
        supplement_reason,
        supplement_amount,
        supplement_submitted_at,
        supplement_status,
        supplement_approved_amount,
        supplement_approved_at
      `)
      .eq('id', estimateId)
      .single();

    if (error || !estimate) {
      return NextResponse.json(
        { success: false, error: 'Estimate not found' },
        { status: 404 }
      );
    }

    if (!estimate.has_active_supplement) {
      return NextResponse.json({
        success: true,
        data: {
          hasSupplements: false,
          supplements: [],
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        hasSupplements: true,
        supplements: [
          {
            id: `supp_${estimate.id}`,
            estimateId: estimate.id,
            reason: estimate.supplement_reason,
            amount: estimate.supplement_amount,
            status: estimate.supplement_status,
            submittedAt: estimate.supplement_submitted_at,
            approvedAmount: estimate.supplement_approved_amount,
            approvedAt: estimate.supplement_approved_at,
          },
        ],
      },
    });
  } catch (error) {
    console.error('Get supplements error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get supplements',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
