import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateRevenueMetrics } from '@/lib/analytics/revenue';
import { customRange, DATE_RANGES, getMonthOverMonthDates, getYearOverYearDates } from '@/lib/analytics/date-ranges';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/analytics/revenue
 * Get revenue analytics for a shop
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId') || 'shop_demo';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const preset = searchParams.get('preset'); // 'last7Days', 'last30Days', etc.

    // Determine date range
    let dateRange;
    if (preset && preset in DATE_RANGES) {
      dateRange = DATE_RANGES[preset as keyof typeof DATE_RANGES]();
    } else if (startDate && endDate) {
      dateRange = customRange(new Date(startDate), new Date(endDate));
    } else {
      // Default to last 30 days
      dateRange = DATE_RANGES.last30Days();
    }

    // Fetch estimates for main period
    const { data: estimates, error } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString())
      .in('status', ['approved', 'completed']);

    if (error) throw error;

    // Fetch previous month for MoM comparison
    const momDates = getMonthOverMonthDates();
    const { data: previousMonthEstimates } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', momDates.previous.startDate.toISOString())
      .lte('created_at', momDates.previous.endDate.toISOString())
      .in('status', ['approved', 'completed']);

    // Fetch previous year for YoY comparison
    const yoyDates = getYearOverYearDates();
    const { data: previousYearEstimates } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', yoyDates.previous.startDate.toISOString())
      .lte('created_at', yoyDates.previous.endDate.toISOString())
      .in('status', ['approved', 'completed']);

    // Calculate metrics
    const metrics = calculateRevenueMetrics(
      estimates || [],
      dateRange,
      previousMonthEstimates || [],
      previousYearEstimates || []
    );

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        dateRange: {
          start: dateRange.startDate.toISOString(),
          end: dateRange.endDate.toISOString(),
          label: dateRange.label,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
