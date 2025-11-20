import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateOperationalMetrics } from '@/lib/analytics/operations';
import { DATE_RANGES, customRange } from '@/lib/analytics/date-ranges';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const preset = searchParams.get('preset');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const maxCapacity = parseInt(searchParams.get('maxCapacity') || '50');

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shopId is required' },
        { status: 400 }
      );
    }

    // Determine date range
    let dateRange;
    if (preset && DATE_RANGES[preset as keyof typeof DATE_RANGES]) {
      dateRange = DATE_RANGES[preset as keyof typeof DATE_RANGES]();
    } else if (startDateParam && endDateParam) {
      dateRange = customRange(new Date(startDateParam), new Date(endDateParam));
    } else {
      dateRange = DATE_RANGES.last30Days();
    }

    // Fetch estimates in date range
    const { data: estimates, error: estimatesError } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (estimatesError) {
      console.error('Error fetching estimates:', estimatesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch estimates' },
        { status: 500 }
      );
    }

    // Fetch parts orders (if table exists)
    const { data: partsOrders, error: partsOrdersError } = await supabaseAdmin
      .from('parts_orders')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    // Ignore error if table doesn't exist yet
    if (partsOrdersError && !partsOrdersError.message.includes('does not exist')) {
      console.error('Error fetching parts orders:', partsOrdersError);
    }

    // Calculate operational metrics
    const metrics = calculateOperationalMetrics(
      estimates || [],
      dateRange,
      partsOrders || [],
      maxCapacity
    );

    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Error in operational analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
