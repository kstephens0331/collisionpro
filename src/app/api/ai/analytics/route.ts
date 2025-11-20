import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * AI Analytics API
 * GET /api/ai/analytics?range=30d
 *
 * Returns AI damage detection analytics and metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = new Date('2020-01-01');
    }

    // For now, return demo data since we don't have real AI analysis records yet
    // In production, this would query from a dedicated AIAnalysis table
    const analytics = await getAnalyticsFromDatabase(undefined, startDate, now);

    return NextResponse.json({
      success: true,
      data: analytics,
      range,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get analytics from database
 * This is a placeholder that returns demo data
 * In production, query from AIAnalysis table
 */
async function getAnalyticsFromDatabase(shopId: string | undefined, startDate: Date, endDate: Date) {
  // In production, you would:
  // 1. Query AIAnalysis records for the shop within date range
  // 2. Aggregate damage types, panel locations, confidence scores
  // 3. Calculate time savings based on manual vs AI estimate creation
  // 4. Track manual overrides to measure accuracy

  // For now, return realistic demo data
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const analysesPerDay = 8; // Average analyses per day
  const totalAnalyses = Math.round(daysDiff * analysesPerDay);
  const damagesPerAnalysis = 2.5;
  const totalDamages = Math.round(totalAnalyses * damagesPerAnalysis);

  // Calculate savings (5 min saved per analysis at $65/hr technician rate)
  const minSavedPerAnalysis = 5;
  const hourlyRate = 65;
  const timeSavingsMin = totalAnalyses * minSavedPerAnalysis;
  const costSavings = Math.round((timeSavingsMin / 60) * hourlyRate);

  return {
    totalAnalyses,
    totalDamagesDetected: totalDamages,
    avgConfidence: 87.3,
    avgProcessingTime: 1340,
    vehicleDetectionRate: 96.4,
    manualOverrideRate: 8.2,
    estimatedTimeSavings: timeSavingsMin,
    estimatedCostSavings: costSavings,
    damagePatterns: [
      { type: 'dent', count: Math.round(totalDamages * 0.31), percentage: 30.9, avgConfidence: 89.2 },
      { type: 'scratch', count: Math.round(totalDamages * 0.255), percentage: 25.5, avgConfidence: 91.4 },
      { type: 'paint_damage', count: Math.round(totalDamages * 0.16), percentage: 16.0, avgConfidence: 85.7 },
      { type: 'crack', count: Math.round(totalDamages * 0.109), percentage: 10.9, avgConfidence: 88.3 },
      { type: 'bumper_damage', count: Math.round(totalDamages * 0.088), percentage: 8.8, avgConfidence: 84.6 },
      { type: 'broken', count: Math.round(totalDamages * 0.078), percentage: 7.8, avgConfidence: 92.1 },
    ],
    panelStats: [
      { location: 'front_bumper', count: Math.round(totalAnalyses * 0.352), percentage: 35.2, avgRepairCost: 485 },
      { location: 'rear_bumper', count: Math.round(totalAnalyses * 0.227), percentage: 22.7, avgRepairCost: 420 },
      { location: 'left_fender', count: Math.round(totalAnalyses * 0.17), percentage: 17.0, avgRepairCost: 380 },
      { location: 'hood', count: Math.round(totalAnalyses * 0.126), percentage: 12.6, avgRepairCost: 650 },
      { location: 'right_fender', count: Math.round(totalAnalyses * 0.126), percentage: 12.6, avgRepairCost: 380 },
    ],
    weeklyTrend: generateWeeklyTrend(daysDiff),
    accuracyByType: [
      { type: 'scratch', accuracy: 91.4, samples: Math.round(totalDamages * 0.255) },
      { type: 'broken', accuracy: 92.1, samples: Math.round(totalDamages * 0.078) },
      { type: 'dent', accuracy: 89.2, samples: Math.round(totalDamages * 0.31) },
      { type: 'crack', accuracy: 88.3, samples: Math.round(totalDamages * 0.109) },
      { type: 'paint', accuracy: 85.7, samples: Math.round(totalDamages * 0.16) },
    ],
  };
}

/**
 * Generate weekly trend data
 */
function generateWeeklyTrend(days: number) {
  const weeks = Math.min(Math.ceil(days / 7), 12);
  const trend = [];

  for (let i = 0; i < weeks; i++) {
    trend.push({
      week: `W${i + 1}`,
      analyses: Math.round(40 + Math.random() * 30 + i * 3), // Slight upward trend
      accuracy: Math.round((84 + Math.random() * 4 + i * 0.5) * 10) / 10, // Improving accuracy
    });
  }

  return trend;
}
