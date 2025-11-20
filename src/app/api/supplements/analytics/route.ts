import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Get supplement analytics for a shop
 * GET /api/supplements/analytics?shopId=xxx&startDate=xxx&endDate=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const shopId = searchParams.get('shopId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: 'Missing shopId parameter' },
        { status: 400 }
      );
    }

    // Date range defaults
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago
    const end = endDate || new Date().toISOString();

    // Fetch supplement recommendations for this shop
    const { data: recommendations, error: recError } = await supabaseAdmin
      .from('supplement_recommendations')
      .select('*')
      .eq('shop_id', shopId)
      .gte('created_at', start)
      .lte('created_at', end);

    if (recError) {
      console.error('Error fetching recommendations:', recError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    const recs = recommendations || [];

    // Calculate summary statistics
    const totalRecommendations = recs.length;
    const acceptedRecommendations = recs.filter((r) => r.was_accepted).length;
    const submittedSupplements = recs.filter((r) => r.was_submitted).length;
    const approvedSupplements = recs.filter((r) => r.was_approved === true).length;
    const rejectedSupplements = recs.filter((r) => r.was_approved === false).length;

    // Calculate revenue and amounts
    const totalSupplementRevenue = recs
      .filter((r) => r.actual_amount)
      .reduce((sum, r) => sum + (r.actual_amount || 0), 0);

    const avgSupplementAmount =
      approvedSupplements > 0 ? totalSupplementRevenue / approvedSupplements : 0;

    const avgApprovalRate =
      submittedSupplements > 0 ? (approvedSupplements / submittedSupplements) * 100 : 0;

    // Calculate average accuracy score
    const recsWithAccuracy = recs.filter((r) => r.accuracy_score !== null);
    const avgAccuracyScore =
      recsWithAccuracy.length > 0
        ? recsWithAccuracy.reduce((sum, r) => sum + (r.accuracy_score || 0), 0) /
          recsWithAccuracy.length
        : 0;

    // Top triggers (most common supplement reasons)
    const triggerCounts = new Map<string, { count: number; approved: number; totalAmount: number }>();
    for (const rec of recs.filter((r) => r.was_submitted)) {
      const trigger = rec.trigger;
      const existing = triggerCounts.get(trigger) || { count: 0, approved: 0, totalAmount: 0 };
      existing.count++;
      if (rec.was_approved) {
        existing.approved++;
        existing.totalAmount += rec.actual_amount || 0;
      }
      triggerCounts.set(trigger, existing);
    }

    const topTriggers = Array.from(triggerCounts.entries())
      .map(([trigger, stats]) => ({
        trigger,
        count: stats.count,
        approvalRate: stats.count > 0 ? (stats.approved / stats.count) * 100 : 0,
        avgAmount: stats.approved > 0 ? stats.totalAmount / stats.approved : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate time saved (estimated)
    // Assumption: Pre-disassembly detection saves 2 hours per supplement
    const timeSaved = acceptedRecommendations * 2; // hours

    // Calculate average cycle time for approved supplements
    let avgCycleTime = 0;
    const approvedWithDates = recs.filter(
      (r) => r.was_approved && r.created_at && r.accepted_at
    );
    if (approvedWithDates.length > 0) {
      const totalDays = approvedWithDates.reduce((sum, r) => {
        const created = new Date(r.created_at).getTime();
        const accepted = new Date(r.accepted_at!).getTime();
        const days = (accepted - created) / (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgCycleTime = totalDays / approvedWithDates.length;
    }

    // Monthly trend data
    const monthlyData = new Map<string, any>();
    for (const rec of recs.filter((r) => r.was_submitted)) {
      const month = new Date(rec.created_at).toISOString().substring(0, 7); // "2025-11"
      const existing = monthlyData.get(month) || {
        month,
        count: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0,
        totalDays: 0,
      };

      existing.count++;
      if (rec.was_approved === true) {
        existing.approved++;
        existing.totalAmount += rec.actual_amount || 0;
      } else if (rec.was_approved === false) {
        existing.rejected++;
      }

      monthlyData.set(month, existing);
    }

    const monthlyTrend = Array.from(monthlyData.values())
      .map((m) => ({
        month: m.month,
        count: m.count,
        approved: m.approved,
        rejected: m.rejected,
        totalAmount: m.totalAmount,
        avgCycleTime: m.approved > 0 ? m.totalDays / m.approved : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRecommendations,
          acceptedRecommendations,
          submittedSupplements,
          approvedSupplements,
          rejectedSupplements,
          totalSupplementRevenue,
          avgSupplementAmount,
          avgApprovalRate,
          avgAccuracyScore,
          timeSaved,
          avgCycleTime,
        },
        topTriggers,
        monthlyTrend,
        dateRange: {
          start,
          end,
        },
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
