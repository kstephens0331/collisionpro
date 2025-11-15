import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/estimates
 * Fetch all estimates for the current shop
 */
export async function GET(request: Request) {
  try {
    // TODO: Get shopId from authenticated session
    // For now, get any shop's estimates
    const { data: estimates, error } = await supabaseAdmin
      .from('Estimate')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch estimates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      estimates: estimates || [],
    });
  } catch (error: any) {
    console.error('Error fetching estimates:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/estimates
 * Create a new estimate
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Generate estimate number
    const estimateNumber = `EST-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // TODO: Get shopId and userId from authenticated session
    const shopId = 'shop_demo'; // Placeholder
    const userId = 'user_demo'; // Placeholder

    const estimateData = {
      id: `est_${Date.now()}`,
      estimateNumber,
      shopId,
      createdBy: userId,
      status: 'draft',
      customerName: body.customerName,
      customerEmail: body.customerEmail || null,
      customerPhone: body.customerPhone || null,
      customerAddress: body.customerAddress || null,
      vehicleYear: body.vehicleYear,
      vehicleMake: body.vehicleMake,
      vehicleModel: body.vehicleModel,
      vehicleVin: body.vehicleVin || null,
      vehicleTrim: body.vehicleTrim || null,
      vehicleMileage: body.vehicleMileage || null,
      vehicleColor: body.vehicleColor || null,
      vehicleLicensePlate: body.vehicleLicensePlate || null,
      damageDescription: body.damageDescription || null,
      dateOfLoss: body.dateOfLoss || null,
      insuranceCompany: body.insuranceCompany || null,
      claimNumber: body.claimNumber || null,
      policyNumber: body.policyNumber || null,
      laborRate: body.laborRate || 75.00,
      taxRate: body.taxRate || 0.0825,
      notes: body.notes || null,
      internalNotes: body.internalNotes || null,
      partsSubtotal: 0,
      laborSubtotal: 0,
      paintSubtotal: 0,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
      deductible: body.deductible || 0,
    };

    const { data: estimate, error } = await supabaseAdmin
      .from('Estimate')
      .insert(estimateData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create estimate' },
        { status: 500 }
      );
    }

    // Log estimate creation
    await supabaseAdmin.from('EstimateHistory').insert({
      id: `history_${Date.now()}`,
      estimateId: estimate.id,
      action: 'created',
      description: 'Estimate created',
      userId,
      userName: 'User', // TODO: Get from session
      metadata: { estimateNumber: estimate.estimateNumber },
    });

    return NextResponse.json({
      success: true,
      estimate,
    });
  } catch (error: any) {
    console.error('Error creating estimate:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
