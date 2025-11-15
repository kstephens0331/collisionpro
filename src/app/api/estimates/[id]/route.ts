import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/estimates/[id]
 * Fetch a single estimate by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: estimate, error } = await supabaseAdmin
      .from('Estimate')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch estimate' },
        { status: 500 }
      );
    }

    if (!estimate) {
      return NextResponse.json(
        { success: false, error: 'Estimate not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      estimate,
    });
  } catch (error: any) {
    console.error('Error fetching estimate:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/estimates/[id]
 * Update an estimate
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data: estimate, error } = await supabaseAdmin
      .from('Estimate')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update estimate' },
        { status: 500 }
      );
    }

    // Log update to history
    await supabaseAdmin.from('EstimateHistory').insert({
      id: `history_${Date.now()}`,
      estimateId: id,
      action: 'updated',
      description: 'Estimate updated',
      userId: 'user_demo', // TODO: Get from session
      userName: 'User',
      metadata: { fields: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      estimate,
    });
  } catch (error: any) {
    console.error('Error updating estimate:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/estimates/[id]
 * Delete an estimate
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { error } = await supabaseAdmin
      .from('Estimate')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete estimate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting estimate:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
