import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateRevenueMetrics } from '@/lib/analytics/revenue';
import { calculateCustomerMetrics } from '@/lib/analytics/customers';
import { calculateOperationalMetrics } from '@/lib/analytics/operations';
import { DATE_RANGES } from '@/lib/analytics/date-ranges';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const preset = searchParams.get('preset') || 'last30Days';
    const type = searchParams.get('type') || 'csv';

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'shopId is required' },
        { status: 400 }
      );
    }

    // Get date range
    const dateRange = DATE_RANGES[preset as keyof typeof DATE_RANGES]
      ? DATE_RANGES[preset as keyof typeof DATE_RANGES]()
      : DATE_RANGES.last30Days();

    // Fetch all estimates
    const { data: estimates } = await supabaseAdmin
      .from('estimates')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());

    if (type === 'csv') {
      // Generate CSV export
      const csv = generateCSV(estimates || [], dateRange);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${preset}.csv"`,
        },
      });
    } else if (type === 'pdf') {
      // PDF export (placeholder - requires jsPDF library)
      return NextResponse.json(
        {
          success: false,
          error: 'PDF export requires additional setup. Please install jsPDF library.'
        },
        { status: 501 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Invalid export type' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in export:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate CSV from estimates data
 */
function generateCSV(estimates: any[], dateRange: any): string {
  const headers = [
    'Estimate ID',
    'Customer Name',
    'Vehicle',
    'Status',
    'Total',
    'Created Date',
    'Insurance Company',
  ];

  const rows = estimates.map(est => [
    est.id,
    est.customer_name || 'N/A',
    `${est.vehicle_year || ''} ${est.vehicle_make || ''} ${est.vehicle_model || ''}`.trim() || 'N/A',
    est.status,
    est.total || 0,
    new Date(est.created_at).toLocaleDateString(),
    est.insurance_company || 'None',
  ]);

  // Add summary section
  const totalRevenue = estimates
    .filter(est => est.status === 'approved' || est.status === 'completed')
    .reduce((sum, est) => sum + (est.total || 0), 0);

  const avgEstimate = estimates.length > 0 ? totalRevenue / estimates.length : 0;

  const summaryRows = [
    [],
    ['SUMMARY'],
    ['Date Range', dateRange.label],
    ['Total Estimates', estimates.length.toString()],
    ['Total Revenue', `$${totalRevenue.toLocaleString()}`],
    ['Average Estimate', `$${avgEstimate.toLocaleString()}`],
  ];

  const allRows = [headers, ...rows, ...summaryRows];

  return allRows.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n');
}
