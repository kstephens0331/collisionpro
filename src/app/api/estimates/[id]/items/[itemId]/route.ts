import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * DELETE /api/estimates/[id]/items/[itemId]
 * Delete a line item from an estimate
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    // Get item details before deleting for history log
    const { data: item } = await supabaseAdmin
      .from('EstimateLineItem')
      .select('*')
      .eq('id', params.itemId)
      .single();

    const { error } = await supabaseAdmin
      .from('EstimateLineItem')
      .delete()
      .eq('id', params.itemId);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete line item' },
        { status: 500 }
      );
    }

    // Recalculate estimate totals
    await recalculateEstimateTotals(params.id);

    // Log to history
    if (item) {
      await supabaseAdmin.from('EstimateHistory').insert({
        id: `history_${Date.now()}`,
        estimateId: params.id,
        action: 'item_removed',
        description: `Removed ${item.type}: ${item.partName}`,
        userId: 'user_demo', // TODO: Get from session
        userName: 'User',
        metadata: { itemId: params.itemId },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Error deleting line item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/estimates/[id]/items/[itemId]
 * Update a line item
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const body = await request.json();

    // Recalculate line total if quantity or price changed
    if (body.quantity !== undefined || body.unitPrice !== undefined) {
      const { data: currentItem } = await supabaseAdmin
        .from('EstimateLineItem')
        .select('quantity, unitPrice')
        .eq('id', params.itemId)
        .single();

      const quantity = body.quantity !== undefined ? body.quantity : currentItem?.quantity || 1;
      const unitPrice = body.unitPrice !== undefined ? body.unitPrice : currentItem?.unitPrice || 0;
      body.lineTotal = quantity * unitPrice;
    }

    const { data: lineItem, error } = await supabaseAdmin
      .from('EstimateLineItem')
      .update(body)
      .eq('id', params.itemId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update line item' },
        { status: 500 }
      );
    }

    // Recalculate estimate totals
    await recalculateEstimateTotals(params.id);

    // Log to history
    await supabaseAdmin.from('EstimateHistory').insert({
      id: `history_${Date.now()}`,
      estimateId: params.id,
      action: 'item_updated',
      description: `Updated ${lineItem.type}: ${lineItem.partName}`,
      userId: 'user_demo', // TODO: Get from session
      userName: 'User',
      metadata: { itemId: params.itemId, fields: Object.keys(body) },
    });

    return NextResponse.json({
      success: true,
      item: lineItem,
    });
  } catch (error: any) {
    console.error('Error updating line item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Recalculate estimate totals based on line items
 */
async function recalculateEstimateTotals(estimateId: string) {
  try {
    // Fetch all line items
    const { data: items } = await supabaseAdmin
      .from('EstimateLineItem')
      .select('*')
      .eq('estimateId', estimateId);

    if (!items) return;

    // Calculate subtotals by type
    let partsSubtotal = 0;
    let laborSubtotal = 0;
    let paintSubtotal = 0;
    let miscSubtotal = 0;

    items.forEach((item) => {
      const lineTotal = item.lineTotal || 0;
      switch (item.type) {
        case 'part':
          partsSubtotal += lineTotal;
          break;
        case 'labor':
          laborSubtotal += lineTotal;
          break;
        case 'paint':
          paintSubtotal += lineTotal;
          break;
        case 'misc':
          miscSubtotal += lineTotal;
          break;
      }
    });

    const subtotal = partsSubtotal + laborSubtotal + paintSubtotal + miscSubtotal;

    // Get tax rate from estimate
    const { data: estimate } = await supabaseAdmin
      .from('Estimate')
      .select('taxRate')
      .eq('id', estimateId)
      .single();

    const taxRate = estimate?.taxRate || 0;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    // Update estimate
    await supabaseAdmin
      .from('Estimate')
      .update({
        partsSubtotal,
        laborSubtotal,
        paintSubtotal,
        subtotal,
        taxAmount,
        total,
      })
      .eq('id', estimateId);
  } catch (error) {
    console.error('Error recalculating totals:', error);
  }
}
