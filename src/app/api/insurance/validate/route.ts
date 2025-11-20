import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { validateEstimateForInsurance } from '@/lib/insurance/validation';
import { FormattedEstimate, InsurancePlatform } from '@/lib/insurance';

export const dynamic = 'force-dynamic';

/**
 * Validate estimate before insurance submission
 * POST /api/insurance/validate
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { estimateId, platform } = body;

    if (!estimateId || !platform) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
          required: ['estimateId', 'platform'],
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

    // Format estimate for validation
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
        claimNumber: estimate.insurance_claim_number || 'PENDING',
        policyNumber: estimate.insurance_policy_number || undefined,
        dateOfLoss: estimate.insurance_date_of_loss || new Date().toISOString(),
        deductible: estimate.insurance_deductible || undefined,
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

    // Run validation
    const validationResult = validateEstimateForInsurance(formattedEstimate, platform);

    return NextResponse.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate estimate',
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
