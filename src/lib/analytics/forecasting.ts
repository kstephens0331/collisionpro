/**
 * Revenue forecasting and predictive analytics
 * COMPETITIVE ADVANTAGE: None of the Big 3 have this!
 */

import { addDays, differenceInDays } from 'date-fns';

export interface ForecastPoint {
  date: string; // YYYY-MM-DD
  forecastedRevenue: number;
  confidence: number; // 0-100
  lowerBound: number;
  upperBound: number;
}

export interface TrendAnalysis {
  direction: 'up' | 'down' | 'flat';
  strength: 'strong' | 'moderate' | 'weak';
  percentChange: number;
  isAccelerating: boolean;
}

/**
 * Forecast future revenue using linear regression
 */
export function forecastRevenue(
  historicalData: Array<{ date: string; revenue: number }>,
  daysAhead: number = 30
): ForecastPoint[] {
  if (historicalData.length < 7) {
    // Not enough data for meaningful forecast
    return [];
  }

  // Prepare data for regression
  const x = historicalData.map((_, i) => i);
  const y = historicalData.map(d => d.revenue);
  const n = x.length;

  // Calculate linear regression: y = mx + b
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  // Calculate standard error for confidence intervals
  const yPredicted = x.map(xi => m * xi + b);
  const residuals = y.map((yi, i) => yi - yPredicted[i]);
  const sse = residuals.reduce((sum, r) => sum + r * r, 0);
  const standardError = Math.sqrt(sse / (n - 2));

  // Generate forecast
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const forecast: ForecastPoint[] = [];

  for (let i = 1; i <= daysAhead; i++) {
    const futureX = n + i - 1;
    const predictedY = m * futureX + b;

    // Confidence interval (95% ~= 2 standard errors)
    const margin = 2 * standardError * Math.sqrt(1 + 1 / n + Math.pow(futureX - sumX / n, 2) / sumXX);

    // Confidence decreases with distance
    const confidence = Math.max(
      50,
      100 - (i / daysAhead) * 30 // 100% at day 1, 70% at day 30
    );

    forecast.push({
      date: addDays(lastDate, i).toISOString().split('T')[0],
      forecastedRevenue: Math.max(0, predictedY),
      confidence,
      lowerBound: Math.max(0, predictedY - margin),
      upperBound: predictedY + margin,
    });
  }

  return forecast;
}

/**
 * Analyze revenue trend direction and strength
 */
export function analyzeTrend(
  revenueData: Array<{ date: string; revenue: number }>
): TrendAnalysis {
  if (revenueData.length < 3) {
    return {
      direction: 'flat',
      strength: 'weak',
      percentChange: 0,
      isAccelerating: false,
    };
  }

  // Split data into first half and second half
  const midpoint = Math.floor(revenueData.length / 2);
  const firstHalf = revenueData.slice(0, midpoint);
  const secondHalf = revenueData.slice(midpoint);

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.revenue, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.revenue, 0) / secondHalf.length;

  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;

  // Determine direction
  let direction: TrendAnalysis['direction'];
  if (Math.abs(percentChange) < 5) direction = 'flat';
  else if (percentChange > 0) direction = 'up';
  else direction = 'down';

  // Determine strength
  let strength: TrendAnalysis['strength'];
  const absChange = Math.abs(percentChange);
  if (absChange > 20) strength = 'strong';
  else if (absChange > 10) strength = 'moderate';
  else strength = 'weak';

  // Check if trend is accelerating (comparing growth rates)
  const quarter1 = revenueData.slice(0, Math.floor(revenueData.length / 4));
  const quarter4 = revenueData.slice(-Math.floor(revenueData.length / 4));
  const q1Avg = quarter1.reduce((sum, d) => sum + d.revenue, 0) / quarter1.length;
  const q4Avg = quarter4.reduce((sum, d) => sum + d.revenue, 0) / quarter4.length;
  const recentChange = ((q4Avg - q1Avg) / q1Avg) * 100;

  const isAccelerating = Math.abs(recentChange) > Math.abs(percentChange);

  return {
    direction,
    strength,
    percentChange,
    isAccelerating,
  };
}

/**
 * Predict when shop will hit capacity limit
 */
export function predictCapacityLimit(
  estimatesPerDay: Array<{ date: string; count: number }>,
  maxDailyCapacity: number
): { daysUntilFull: number; date: string | null; confidence: number } {
  if (estimatesPerDay.length < 7) {
    return { daysUntilFull: -1, date: null, confidence: 0 };
  }

  // Calculate trend
  const x = estimatesPerDay.map((_, i) => i);
  const y = estimatesPerDay.map(d => d.count);
  const n = x.length;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  // Current estimate count
  const currentCount = m * (n - 1) + b;

  if (m <= 0) {
    // Not trending up, won't hit capacity
    return { daysUntilFull: -1, date: null, confidence: 0 };
  }

  // Calculate when we'll hit capacity
  // maxDailyCapacity = m * daysFromNow + currentCount
  const daysUntilFull = Math.ceil((maxDailyCapacity - currentCount) / m);

  if (daysUntilFull < 0) {
    // Already at/over capacity
    return { daysUntilFull: 0, date: new Date().toISOString().split('T')[0], confidence: 95 };
  }

  const lastDate = new Date(estimatesPerDay[estimatesPerDay.length - 1].date);
  const capacityDate = addDays(lastDate, daysUntilFull);

  // Confidence decreases with distance
  const confidence = Math.max(50, 100 - daysUntilFull);

  return {
    daysUntilFull,
    date: capacityDate.toISOString().split('T')[0],
    confidence,
  };
}

/**
 * Calculate seasonal multipliers for revenue
 */
export function detectSeasonality(
  monthlyRevenue: Array<{ month: string; revenue: number }>
): Map<number, number> {
  // Returns multiplier by month (1-12)
  // e.g., December might be 1.2 (20% higher than average)

  if (monthlyRevenue.length < 12) {
    // Not enough data for seasonal analysis
    return new Map();
  }

  // Group by month number
  const revenueByMonth = new Map<number, number[]>();

  monthlyRevenue.forEach(({ month, revenue }) => {
    const monthNum = parseInt(month.split('-')[1]);
    if (!revenueByMonth.has(monthNum)) {
      revenueByMonth.set(monthNum, []);
    }
    revenueByMonth.get(monthNum)!.push(revenue);
  });

  // Calculate average for each month
  const avgRevenue = monthlyRevenue.reduce((sum, d) => sum + d.revenue, 0) / monthlyRevenue.length;

  const seasonalMultipliers = new Map<number, number>();

  for (let month = 1; month <= 12; month++) {
    const monthRevenues = revenueByMonth.get(month) || [];
    if (monthRevenues.length > 0) {
      const monthAvg = monthRevenues.reduce((a, b) => a + b, 0) / monthRevenues.length;
      const multiplier = monthAvg / avgRevenue;
      seasonalMultipliers.set(month, multiplier);
    }
  }

  return seasonalMultipliers;
}

/**
 * Predict customer churn probability
 */
export function predictChurnProbability(
  daysSinceLastVisit: number,
  totalVisits: number,
  avgDaysBetweenVisits: number
): number {
  // Simple churn model based on recency and frequency
  // Returns probability 0-100

  if (totalVisits === 1) {
    // New customer - higher churn risk
    if (daysSinceLastVisit > 180) return 90;
    if (daysSinceLastVisit > 90) return 60;
    return 30;
  }

  // Loyal customer
  const expectedVisitWindow = avgDaysBetweenVisits * 1.5;

  if (daysSinceLastVisit < expectedVisitWindow) {
    return 10; // Low risk
  } else if (daysSinceLastVisit < expectedVisitWindow * 2) {
    return 40; // Medium risk
  } else if (daysSinceLastVisit < expectedVisitWindow * 3) {
    return 70; // High risk
  } else {
    return 95; // Very high risk (likely churned)
  }
}

/**
 * Estimate optimal pricing based on conversion and revenue
 */
export function calculateOptimalPricing(
  currentAvgPrice: number,
  currentConversionRate: number, // 0-100
  currentRevenue: number
): { suggestedPrice: number; expectedRevenue: number; reasoning: string } {
  // Simple price elasticity model
  // Assumes: 10% price increase = 5% conversion decrease

  const priceElasticity = -0.5; // For every 1% price increase, conversion drops 0.5%

  let bestPrice = currentAvgPrice;
  let bestRevenue = currentRevenue;
  let bestReasoning = 'Current pricing is optimal';

  // Test price points from -20% to +30%
  for (let priceChange = -20; priceChange <= 30; priceChange += 5) {
    const newPrice = currentAvgPrice * (1 + priceChange / 100);
    const conversionChange = priceChange * priceElasticity;
    const newConversionRate = Math.max(
      10,
      Math.min(100, currentConversionRate + conversionChange)
    );

    const estimatedRevenue =
      (newPrice * (currentRevenue / currentAvgPrice) * newConversionRate) /
      currentConversionRate;

    if (estimatedRevenue > bestRevenue) {
      bestRevenue = estimatedRevenue;
      bestPrice = newPrice;

      if (priceChange > 0) {
        bestReasoning = `Increase prices by ${priceChange}% - revenue could improve by ${(
          ((bestRevenue - currentRevenue) / currentRevenue) *
          100
        ).toFixed(1)}%`;
      } else {
        bestReasoning = `Lower prices by ${Math.abs(priceChange)}% to increase volume`;
      }
    }
  }

  return {
    suggestedPrice: bestPrice,
    expectedRevenue: bestRevenue,
    reasoning: bestReasoning,
  };
}
