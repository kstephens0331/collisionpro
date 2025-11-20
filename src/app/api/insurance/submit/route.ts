import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  submitEstimate,
  InsurancePlatform,
  FormattedEstimate,
  validateClaimNumber,
  formatClaimNumber,
  getInsuranceCompany,
} from '@/lib/insurance';

export const dynamic = 'force-dynamic';

/**
 * Submit estimate to insurance platform
 * POST /api/insurance/submit
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      estimateId,
      platform,
      claimNumber,
      insuranceCompanyId,
      policyNumber,
      dateOfLoss,
      deductible,
      adjusterName,
      adjusterEmail,
      adjusterPhone,
    } = body;

    // Validate required fields
    if (!estimateId || !platform || !claimNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['estimateId', 'platform', 'claimNumber'],
        },
        { status: 400 }
      );
    }

    // Validate platform
    if (!['ccc_one', 'mitchell', 'audatex'].includes(platform)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid platform',
          validPlatforms: ['ccc_one', 'mitchell', 'audatex'],
        },
        { status: 400 }
      );
    }

    // Validate claim number format
    if (!validateClaimNumber(claimNumber)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid claim number format',
          note: 'Claim numbers should be 5-25 alphanumeric characters',
        },
        { status: 400 }
      );
    }

    // Fetch estimate with all related data
    const { data: estimate, error: fetchError } = await supabaseAdmin
      .from('estimates')
      .select(`
        *,
        items:estimate_items(*),
        customer:customers(*),
        shop:shops(*)
      `)
      .eq('id', estimateId)
      .single();

    if (fetchError || !estimate) {
      return NextResponse.json(
        { success: false, error: 'Estimate not found' },
        { status: 404 }
      );
    }

    // Get insurance company info if provided
    const insuranceCompany = insuranceCompanyId
      ? getInsuranceCompany(insuranceCompanyId)
      : null;

    // Format estimate for submission
    const formattedEstimate: FormattedEstimate = {
      shopInfo: {
        name: estimate.shop?.name || 'CollisionPro Shop',
        address: estimate.shop?.address || '',
        phone: estimate.shop?.phone || '',
        email: estimate.shop?.email || '',
        taxId: estimate.shop?.tax_id || undefined,
        licenseNumber: estimate.shop?.license_number || undefined,
      },
      vehicleInfo: {
        vin: estimate.vin || '',
        year: estimate.vehicle_year || 0,
        make: estimate.vehicle_make || '',
        model: estimate.vehicle_model || '',
        trim: estimate.vehicle_trim || undefined,
        color: estimate.vehicle_color || undefined,
        mileage: estimate.mileage || undefined,
        plateNumber: estimate.plate_number || undefined,
      },
      claimInfo: {
        claimNumber: formatClaimNumber(claimNumber),
        policyNumber: policyNumber || undefined,
        dateOfLoss: dateOfLoss || new Date().toISOString(),
        deductible: deductible || undefined,
      },
      customerInfo: {
        name: estimate.customer?.name || estimate.customer_name || 'Unknown',
        phone: estimate.customer?.phone || estimate.customer_phone || undefined,
        email: estimate.customer?.email || estimate.customer_email || undefined,
        address: estimate.customer?.address || undefined,
      },
      lineItems: (estimate.items || []).map((item: any) => ({
        id: item.id,
        type: mapItemType(item.type),
        operationCode: item.operation_code || undefined,
        description: item.description,
        panelLocation: item.panel_location || undefined,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || 0,
        hours: item.labor_hours || undefined,
        laborRate: item.labor_rate || undefined,
        paintHours: item.paint_hours || undefined,
        totalPrice: item.total_price || 0,
        partNumber: item.part_number || undefined,
        manufacturer: item.manufacturer || undefined,
        partType: item.part_type || undefined,
      })),
      totals: {
        laborTotal: estimate.labor_total || 0,
        partsTotal: estimate.parts_total || 0,
        paintTotal: estimate.paint_total || 0,
        subtotal: estimate.subtotal || 0,
        taxRate: estimate.tax_rate || 0,
        taxAmount: estimate.tax_amount || 0,
        total: estimate.total || 0,
      },
      photos: estimate.photos || undefined,
      notes: estimate.notes || undefined,
    };

    // Submit to insurance platform
    const result = await submitEstimate(
      platform as InsurancePlatform,
      formattedEstimate,
      formatClaimNumber(claimNumber)
    );

    // Store submission record in database
    const { error: updateError } = await supabaseAdmin
      .from('estimates')
      .update({
        insurance_claim_number: formatClaimNumber(claimNumber),
        insurance_company: insuranceCompany?.name || insuranceCompanyId || platform,
        insurance_platform: platform,
        insurance_status: result.status,
        insurance_external_id: result.externalId,
        insurance_submitted_at: new Date().toISOString(),
        insurance_policy_number: policyNumber || null,
        insurance_date_of_loss: dateOfLoss || null,
        insurance_deductible: deductible || null,
        insurance_adjuster_name: adjusterName || null,
        insurance_adjuster_email: adjusterEmail || null,
        insurance_adjuster_phone: adjusterPhone || null,
      })
      .eq('id', estimateId);

    if (updateError) {
      console.error('Failed to update estimate with insurance info:', updateError);
    }

    return NextResponse.json({
      success: result.success,
      data: {
        submissionId: result.externalId,
        status: result.status,
        message: result.message,
        estimatedReviewTime: result.estimatedReviewTime,
        platform,
        claimNumber: formatClaimNumber(claimNumber),
        ...result.additionalInfo,
      },
    });
  } catch (error) {
    console.error('Insurance submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit estimate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Map item type to standard format
 */
function mapItemType(type: string | null): 'labor' | 'parts' | 'paint' | 'other' {
  if (!type) return 'other';
  const lowerType = type.toLowerCase();
  if (lowerType.includes('labor')) return 'labor';
  if (lowerType.includes('part')) return 'parts';
  if (lowerType.includes('paint') || lowerType.includes('refinish')) return 'paint';
  return 'other';
}
