/**
 * Date range utilities for analytics
 */

import { startOfDay, endOfDay, subDays, subMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

/**
 * Predefined date ranges
 */
export const DATE_RANGES = {
  today: (): DateRange => ({
    startDate: startOfDay(new Date()),
    endDate: endOfDay(new Date()),
    label: 'Today',
  }),

  yesterday: (): DateRange => ({
    startDate: startOfDay(subDays(new Date(), 1)),
    endDate: endOfDay(subDays(new Date(), 1)),
    label: 'Yesterday',
  }),

  last7Days: (): DateRange => ({
    startDate: startOfDay(subDays(new Date(), 6)),
    endDate: endOfDay(new Date()),
    label: 'Last 7 Days',
  }),

  last30Days: (): DateRange => ({
    startDate: startOfDay(subDays(new Date(), 29)),
    endDate: endOfDay(new Date()),
    label: 'Last 30 Days',
  }),

  last90Days: (): DateRange => ({
    startDate: startOfDay(subDays(new Date(), 89)),
    endDate: endOfDay(new Date()),
    label: 'Last 90 Days',
  }),

  thisMonth: (): DateRange => ({
    startDate: startOfMonth(new Date()),
    endDate: endOfMonth(new Date()),
    label: 'This Month',
  }),

  lastMonth: (): DateRange => {
    const lastMonth = subMonths(new Date(), 1);
    return {
      startDate: startOfMonth(lastMonth),
      endDate: endOfMonth(lastMonth),
      label: 'Last Month',
    };
  },

  thisYear: (): DateRange => ({
    startDate: startOfYear(new Date()),
    endDate: endOfYear(new Date()),
    label: 'This Year',
  }),

  allTime: (): DateRange => ({
    startDate: new Date('2020-01-01'), // Reasonable start date for new software
    endDate: endOfDay(new Date()),
    label: 'All Time',
  }),
};

/**
 * Create custom date range
 */
export function customRange(startDate: Date, endDate: Date): DateRange {
  return {
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate),
    label: `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
  };
}

/**
 * Format date range for API
 */
export function formatDateRangeForAPI(range: DateRange): { startDate: string; endDate: string } {
  return {
    startDate: range.startDate.toISOString(),
    endDate: range.endDate.toISOString(),
  };
}

/**
 * Get month-over-month comparison dates
 */
export function getMonthOverMonthDates(): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const lastMonth = subMonths(now, 1);

  return {
    current: {
      startDate: startOfMonth(now),
      endDate: endOfMonth(now),
      label: 'This Month',
    },
    previous: {
      startDate: startOfMonth(lastMonth),
      endDate: endOfMonth(lastMonth),
      label: 'Last Month',
    },
  };
}

/**
 * Get year-over-year comparison dates
 */
export function getYearOverYearDates(): { current: DateRange; previous: DateRange } {
  const now = new Date();
  const lastYear = subMonths(now, 12);

  return {
    current: {
      startDate: startOfYear(now),
      endDate: endOfYear(now),
      label: 'This Year',
    },
    previous: {
      startDate: startOfYear(lastYear),
      endDate: endOfYear(lastYear),
      label: 'Last Year',
    },
  };
}

/**
 * Calculate growth percentage
 */
export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
