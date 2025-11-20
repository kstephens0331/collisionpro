/**
 * Customer analytics calculations
 */

import { format, eachMonthOfInterval, differenceInMonths } from 'date-fns';
import type { DateRange } from './date-ranges';

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  avgLifetimeValue: number;
  churnRate: number;
  retentionRate: number;
  topCustomers: TopCustomer[];
  newVsReturning: NewVsReturningByMonth[];
  customerSatisfaction: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalRevenue: number;
  estimateCount: number;
  avgEstimateValue: number;
  lastVisit: string;
}

export interface NewVsReturningByMonth {
  month: string; // YYYY-MM
  newCustomers: number;
  returningCustomers: number;
}

/**
 * Calculate customer metrics from estimate data
 */
export function calculateCustomerMetrics(
  estimates: any[],
  dateRange: DateRange,
  allEstimates?: any[] // All-time estimates for LTV calculation
): CustomerMetrics {
  // Get unique customers in the date range
  const customersInRange = new Set(
    estimates
      .filter(est => {
        const estDate = new Date(est.created_at);
        return estDate >= dateRange.startDate && estDate <= dateRange.endDate;
      })
      .map(est => est.customer_id)
      .filter(Boolean)
  );

  // Get all-time customer IDs
  const allTimeCustomers = allEstimates
    ? new Set(allEstimates.map(est => est.customer_id).filter(Boolean))
    : customersInRange;

  // Identify new vs returning customers
  const newCustomers: Set<string> = new Set();
  const returningCustomers: Set<string> = new Set();

  customersInRange.forEach(customerId => {
    const customerEstimates = (allEstimates || estimates).filter(
      est => est.customer_id === customerId
    );
    const firstEstimate = customerEstimates.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )[0];
    const firstEstimateDate = new Date(firstEstimate.created_at);

    if (
      firstEstimateDate >= dateRange.startDate &&
      firstEstimateDate <= dateRange.endDate
    ) {
      newCustomers.add(customerId);
    } else {
      returningCustomers.add(customerId);
    }
  });

  // Calculate average lifetime value
  const customerRevenues = new Map<string, number>();
  (allEstimates || estimates).forEach(est => {
    if (est.customer_id && (est.status === 'approved' || est.status === 'completed')) {
      const current = customerRevenues.get(est.customer_id) || 0;
      customerRevenues.set(est.customer_id, current + (est.total || 0));
    }
  });

  const avgLifetimeValue =
    customerRevenues.size > 0
      ? Array.from(customerRevenues.values()).reduce((sum, val) => sum + val, 0) /
        customerRevenues.size
      : 0;

  // Calculate churn rate (customers who haven't returned in 6+ months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const activeCustomers = new Set(
    (allEstimates || estimates)
      .filter(est => new Date(est.created_at) >= sixMonthsAgo)
      .map(est => est.customer_id)
      .filter(Boolean)
  );

  const churnRate =
    allTimeCustomers.size > 0
      ? ((allTimeCustomers.size - activeCustomers.size) / allTimeCustomers.size) * 100
      : 0;

  const retentionRate = 100 - churnRate;

  // Top customers by revenue
  const topCustomers = calculateTopCustomers(allEstimates || estimates, 10);

  // New vs returning by month
  const newVsReturning = calculateNewVsReturningByMonth(
    estimates,
    allEstimates || estimates,
    dateRange
  );

  // Customer satisfaction (average review rating)
  const reviewedEstimates = estimates.filter(est => est.customer_rating);
  const customerSatisfaction =
    reviewedEstimates.length > 0
      ? reviewedEstimates.reduce((sum, est) => sum + (est.customer_rating || 0), 0) /
        reviewedEstimates.length
      : 0;

  return {
    totalCustomers: allTimeCustomers.size,
    newCustomers: newCustomers.size,
    returningCustomers: returningCustomers.size,
    avgLifetimeValue,
    churnRate,
    retentionRate,
    topCustomers,
    newVsReturning,
    customerSatisfaction,
  };
}

/**
 * Calculate top customers by revenue
 */
function calculateTopCustomers(estimates: any[], limit: number = 10): TopCustomer[] {
  const customerData = new Map<
    string,
    {
      id: string;
      name: string;
      email: string;
      totalRevenue: number;
      estimateCount: number;
      lastVisit: Date;
    }
  >();

  estimates
    .filter(est => est.customer_id && (est.status === 'approved' || est.status === 'completed'))
    .forEach(est => {
      const customerId = est.customer_id;
      const existing = customerData.get(customerId);

      if (existing) {
        existing.totalRevenue += est.total || 0;
        existing.estimateCount += 1;
        const estDate = new Date(est.created_at);
        if (estDate > existing.lastVisit) {
          existing.lastVisit = estDate;
        }
      } else {
        customerData.set(customerId, {
          id: customerId,
          name: est.customer_name || 'Unknown Customer',
          email: est.customer_email || '',
          totalRevenue: est.total || 0,
          estimateCount: 1,
          lastVisit: new Date(est.created_at),
        });
      }
    });

  return Array.from(customerData.values())
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit)
    .map(customer => ({
      ...customer,
      avgEstimateValue: customer.totalRevenue / customer.estimateCount,
      lastVisit: customer.lastVisit.toISOString(),
    }));
}

/**
 * Calculate new vs returning customers by month
 */
function calculateNewVsReturningByMonth(
  estimates: any[],
  allEstimates: any[],
  dateRange: DateRange
): NewVsReturningByMonth[] {
  const months = eachMonthOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  return months.map(month => {
    const monthStr = format(month, 'yyyy-MM');
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const estimatesInMonth = estimates.filter(est => {
      const estDate = new Date(est.created_at);
      return estDate >= monthStart && estDate <= monthEnd;
    });

    const customersInMonth = new Set(
      estimatesInMonth.map(est => est.customer_id).filter(Boolean)
    );

    let newCount = 0;
    let returningCount = 0;

    customersInMonth.forEach(customerId => {
      const customerAllTimeEstimates = allEstimates.filter(
        est => est.customer_id === customerId
      );
      const firstEstimate = customerAllTimeEstimates.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )[0];
      const firstEstimateDate = new Date(firstEstimate.created_at);

      if (firstEstimateDate >= monthStart && firstEstimateDate <= monthEnd) {
        newCount++;
      } else {
        returningCount++;
      }
    });

    return {
      month: monthStr,
      newCustomers: newCount,
      returningCustomers: returningCount,
    };
  });
}

/**
 * Calculate customer acquisition cost
 */
export function calculateCAC(
  newCustomers: number,
  marketingSpend: number
): number {
  return newCustomers > 0 ? marketingSpend / newCustomers : 0;
}

/**
 * Calculate customer lifetime value to acquisition cost ratio
 */
export function calculateLTVtoCAC(ltv: number, cac: number): number {
  return cac > 0 ? ltv / cac : 0;
}
