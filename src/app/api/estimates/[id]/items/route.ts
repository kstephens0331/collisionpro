import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/estimates/[id]/items
 * Fetch all line items for an estimate
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: items, error } = await supabaseAdmin
      .from('EstimateLineItem')
      .select('*')
      .eq('estimateId', params.id)
      .order('sequence', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch line items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      items: items || [],
    });
  } catch (error: any) {
    console.error('Error fetching line items:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/estimates/[id]/items
 * Add a new line item to an estimate
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Calculate line total
    const quantity = body.quantity || 1;
    const unitPrice = body.unitPrice || 0;
    const lineTotal = quantity * unitPrice;

    // Get the current max sequence number
    const { data: existingItems } = await supabaseAdmin
      .from('EstimateLineItem')
      .select('sequence')
      .eq('estimateId', params.id)
      .order('sequence', { ascending: false })
      .limit(1);

    const nextSequence = existingItems && existingItems.length > 0
      ? (existingItems[0].sequence || 0) + 1
      : 0;

    const lineItemData = {
      id: `item_${Date.now()}`,
      estimateId: params.id,
      type: body.type,
      sequence: nextSequence,
      partId: body.partId || null,
      partNumber: body.partNumber || null,
      partName: body.partName,
      laborOperation: body.laborOperation || null,
      laborHours: body.laborHours || null,
      laborRate: body.laborRate || null,
      paintArea: body.paintArea || null,
      paintType: body.paintType || null,
      paintHours: body.paintHours || null,
      quantity,
      unitPrice,
      lineTotal,
    };

    const { data: lineItem, error } = await supabaseAdmin
      .from('EstimateLineItem')
      .insert(lineItemData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create line item' },
        { status: 500 }
      );
    }

    // Recalculate estimate totals
    await recalculateEstimateTotals(params.id);

    // Log to history
    await supabaseAdmin.from('EstimateHistory').insert({
      id: `history_${Date.now()}`,
      estimateId: params.id,
      action: 'item_added',
      description: `Added ${body.type}: ${body.partName}`,
      userId: 'user_demo', // TODO: Get from session
      userName: 'User',
      metadata: { itemId: lineItem.id },
    });

    return NextResponse.json({
      success: true,
      item: lineItem,
    });
  } catch (error: any) {
    console.error('Error creating line item:', error);
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
