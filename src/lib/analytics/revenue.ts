/**
 * Revenue analytics calculations
 */

import { format, eachDayOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import type { DateRange } from './date-ranges';

export interface RevenueByDay {
  date: string; // YYYY-MM-DD
  revenue: number;
  estimateCount: number;
}

export interface RevenueByMonth {
  month: string; // YYYY-MM
  revenue: number;
  estimateCount: number;
}

export interface RevenueBySource {
  insurance: number;
  cash: number;
  warranty: number;
  other: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  avgEstimateValue: number;
  estimateCount: number;
  revenueByDay: RevenueByDay[];
  revenueByMonth: RevenueByMonth[];
  revenueBySource: RevenueBySource;
  growth: {
    mom: number; // Month-over-month %
    yoy: number; // Year-over-year %
  };
}

/**
 * Calculate revenue metrics from estimate data
 */
export function calculateRevenueMetrics(
  estimates: any[],
  dateRange: DateRange,
  previousMonthEstimates?: any[],
  previousYearEstimates?: any[]
): RevenueMetrics {
  // Filter estimates by date range and completed status
  const completedEstimates = estimates.filter(est => {
    const estDate = new Date(est.created_at);
    return (
      (est.status === 'approved' || est.status === 'completed') &&
      estDate >= dateRange.startDate &&
      estDate <= dateRange.endDate
    );
  });

  // Total revenue
  const totalRevenue = completedEstimates.reduce((sum, est) => sum + (est.total || 0), 0);

  // Average estimate value
  const avgEstimateValue = completedEstimates.length > 0
    ? totalRevenue / completedEstimates.length
    : 0;

  // Revenue by day
  const revenueByDay = calculateRevenueByDay(completedEstimates, dateRange);

  // Revenue by month
  const revenueByMonth = calculateRevenueByMonth(completedEstimates, dateRange);

  // Revenue by source
  const revenueBySource = calculateRevenueBySource(completedEstimates);

  // Growth calculations
  const currentMonthRevenue = totalRevenue;
  const previousMonthRevenue = previousMonthEstimates
    ? previousMonthEstimates.reduce((sum, est) => sum + (est.total || 0), 0)
    : 0;
  const previousYearRevenue = previousYearEstimates
    ? previousYearEstimates.reduce((sum, est) => sum + (est.total || 0), 0)
    : 0;

  const mom = previousMonthRevenue > 0
    ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
    : 0;

  const yoy = previousYearRevenue > 0
    ? ((currentMonthRevenue - previousYearRevenue) / previousYearRevenue) * 100
    : 0;

  return {
    totalRevenue,
    avgEstimateValue,
    estimateCount: completedEstimates.length,
    revenueByDay,
    revenueByMonth,
    revenueBySource,
    growth: { mom, yoy },
  };
}

/**
 * Calculate revenue by day
 */
function calculateRevenueByDay(estimates: any[], dateRange: DateRange): RevenueByDay[] {
  const days = eachDayOfInterval({ start: dateRange.startDate, end: dateRange.endDate });

  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEstimates = estimates.filter(est => {
      const estDate = format(new Date(est.created_at), 'yyyy-MM-dd');
      return estDate === dayStr;
    });

    return {
      date: dayStr,
      revenue: dayEstimates.reduce((sum, est) => sum + (est.total || 0), 0),
      estimateCount: dayEstimates.length,
    };
  });
}

/**
 * Calculate revenue by month
 */
function calculateRevenueByMonth(estimates: any[], dateRange: DateRange): RevenueByMonth[] {
  const months = eachMonthOfInterval({ start: dateRange.startDate, end: dateRange.endDate });

  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthStr = format(month, 'yyyy-MM');

    const monthEstimates = estimates.filter(est => {
      const estDate = new Date(est.created_at);
      return estDate >= monthStart && estDate <= monthEnd;
    });

    return {
      month: monthStr,
      revenue: monthEstimates.reduce((sum, est) => sum + (est.total || 0), 0),
      estimateCount: monthEstimates.length,
    };
  });
}

/**
 * Calculate revenue by source (insurance company)
 */
function calculateRevenueBySource(estimates: any[]): RevenueBySource {
  const sources: RevenueBySource = {
    insurance: 0,
    cash: 0,
    warranty: 0,
    other: 0,
  };

  estimates.forEach(est => {
    const company = (est.insurance_company || '').toLowerCase();

    if (!company || company === 'none' || company === 'self-pay') {
      sources.cash += est.total || 0;
    } else if (company.includes('warranty') || company.includes('extended')) {
      sources.warranty += est.total || 0;
    } else if (company) {
      sources.insurance += est.total || 0;
    } else {
      sources.other += est.total || 0;
    }
  });

  return sources;
}

/**
 * Format revenue for charts (abbreviate large numbers)
 */
export function formatRevenueForChart(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}
