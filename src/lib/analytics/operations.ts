/**
 * Operational metrics calculations
 */

import { differenceInDays, format, eachDayOfInterval } from 'date-fns';
import type { DateRange } from './date-ranges';

export interface OperationalMetrics {
  conversionRate: number; // % of estimates that become approved
  avgCycleTime: number; // Days from created to completed
  estimatesInProgress: number;
  capacityUtilization: number; // % of max capacity (based on estimates/month)
  supplementRate: number; // % of estimates needing supplements
  supplementApprovalRate: number; // % of supplements approved
  partsSpending: number;
  funnel: EstimateFunnel;
  cycleTimeByDay: CycleTimeByDay[];
  topSuppliers: TopSupplier[];
}

export interface EstimateFunnel {
  draft: number;
  sent: number;
  approved: number;
  completed: number;
}

export interface CycleTimeByDay {
  date: string; // YYYY-MM-DD
  avgCycleTime: number;
  count: number;
}

export interface TopSupplier {
  name: string;
  totalSpend: number;
  orderCount: number;
  avgDeliveryTime: number; // days
}

/**
 * Calculate operational metrics from estimate data
 */
export function calculateOperationalMetrics(
  estimates: any[],
  dateRange: DateRange,
  partsOrders?: any[],
  maxMonthlyCapacity: number = 50 // Default capacity
): OperationalMetrics {
  // Filter estimates by date range
  const estimatesInRange = estimates.filter(est => {
    const estDate = new Date(est.created_at);
    return estDate >= dateRange.startDate && estDate <= dateRange.endDate;
  });

  // Estimate funnel
  const funnel = calculateEstimateFunnel(estimatesInRange);

  // Conversion rate (draft → approved)
  const conversionRate =
    funnel.draft + funnel.sent > 0
      ? ((funnel.approved + funnel.completed) / (funnel.draft + funnel.sent + funnel.approved + funnel.completed)) * 100
      : 0;

  // Average cycle time (created → completed)
  const completedEstimates = estimatesInRange.filter(
    est => est.status === 'completed' && est.completed_at
  );
  const avgCycleTime =
    completedEstimates.length > 0
      ? completedEstimates.reduce((sum, est) => {
          const created = new Date(est.created_at);
          const completed = new Date(est.completed_at);
          return sum + differenceInDays(completed, created);
        }, 0) / completedEstimates.length
      : 0;

  // Estimates in progress
  const estimatesInProgress = estimatesInRange.filter(
    est => est.status === 'sent' || est.status === 'approved' || est.status === 'in_progress'
  ).length;

  // Capacity utilization
  const monthCount = Math.max(
    1,
    Math.ceil(
      (dateRange.endDate.getTime() - dateRange.startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)
    )
  );
  const avgEstimatesPerMonth = estimatesInRange.length / monthCount;
  const capacityUtilization = (avgEstimatesPerMonth / maxMonthlyCapacity) * 100;

  // Supplement rate (estimates with supplements)
  const estimatesWithSupplements = estimatesInRange.filter(
    est => est.supplement_requested || est.supplement_amount > 0
  );
  const supplementRate =
    estimatesInRange.length > 0
      ? (estimatesWithSupplements.length / estimatesInRange.length) * 100
      : 0;

  // Supplement approval rate
  const approvedSupplements = estimatesWithSupplements.filter(
    est => est.supplement_approved
  );
  const supplementApprovalRate =
    estimatesWithSupplements.length > 0
      ? (approvedSupplements.length / estimatesWithSupplements.length) * 100
      : 0;

  // Parts spending
  const partsSpending = (partsOrders || [])
    .filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateRange.startDate && orderDate <= dateRange.endDate;
    })
    .reduce((sum, order) => sum + (order.total_cost || 0), 0);

  // Cycle time by day
  const cycleTimeByDay = calculateCycleTimeByDay(completedEstimates, dateRange);

  // Top suppliers
  const topSuppliers = calculateTopSuppliers(partsOrders || [], 5);

  return {
    conversionRate,
    avgCycleTime,
    estimatesInProgress,
    capacityUtilization,
    supplementRate,
    supplementApprovalRate,
    partsSpending,
    funnel,
    cycleTimeByDay,
    topSuppliers,
  };
}

/**
 * Calculate estimate funnel
 */
function calculateEstimateFunnel(estimates: any[]): EstimateFunnel {
  const funnel: EstimateFunnel = {
    draft: 0,
    sent: 0,
    approved: 0,
    completed: 0,
  };

  estimates.forEach(est => {
    switch (est.status) {
      case 'draft':
        funnel.draft++;
        break;
      case 'sent':
      case 'pending':
        funnel.sent++;
        break;
      case 'approved':
      case 'in_progress':
        funnel.approved++;
        break;
      case 'completed':
        funnel.completed++;
        break;
    }
  });

  return funnel;
}

/**
 * Calculate cycle time by day
 */
function calculateCycleTimeByDay(
  completedEstimates: any[],
  dateRange: DateRange
): CycleTimeByDay[] {
  const days = eachDayOfInterval({
    start: dateRange.startDate,
    end: dateRange.endDate,
  });

  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEstimates = completedEstimates.filter(est => {
      const completedDate = format(new Date(est.completed_at), 'yyyy-MM-dd');
      return completedDate === dayStr;
    });

    const avgCycleTime =
      dayEstimates.length > 0
        ? dayEstimates.reduce((sum, est) => {
            const created = new Date(est.created_at);
            const completed = new Date(est.completed_at);
            return sum + differenceInDays(completed, created);
          }, 0) / dayEstimates.length
        : 0;

    return {
      date: dayStr,
      avgCycleTime,
      count: dayEstimates.length,
    };
  });
}

/**
 * Calculate top suppliers by spend
 */
function calculateTopSuppliers(
  partsOrders: any[],
  limit: number = 5
): TopSupplier[] {
  const supplierData = new Map<
    string,
    {
      name: string;
      totalSpend: number;
      orderCount: number;
      totalDeliveryTime: number;
      deliveryCount: number;
    }
  >();

  partsOrders.forEach(order => {
    const supplierName = order.supplier_name || 'Unknown Supplier';
    const existing = supplierData.get(supplierName);

    const deliveryTime = order.delivered_at && order.created_at
      ? differenceInDays(new Date(order.delivered_at), new Date(order.created_at))
      : 0;

    if (existing) {
      existing.totalSpend += order.total_cost || 0;
      existing.orderCount += 1;
      if (deliveryTime > 0) {
        existing.totalDeliveryTime += deliveryTime;
        existing.deliveryCount += 1;
      }
    } else {
      supplierData.set(supplierName, {
        name: supplierName,
        totalSpend: order.total_cost || 0,
        orderCount: 1,
        totalDeliveryTime: deliveryTime > 0 ? deliveryTime : 0,
        deliveryCount: deliveryTime > 0 ? 1 : 0,
      });
    }
  });

  return Array.from(supplierData.values())
    .sort((a, b) => b.totalSpend - a.totalSpend)
    .slice(0, limit)
    .map(supplier => ({
      name: supplier.name,
      totalSpend: supplier.totalSpend,
      orderCount: supplier.orderCount,
      avgDeliveryTime:
        supplier.deliveryCount > 0
          ? supplier.totalDeliveryTime / supplier.deliveryCount
          : 0,
    }));
}

/**
 * Calculate labor utilization rate
 */
export function calculateLaborUtilization(
  totalLaborHours: number,
  billableLaborHours: number
): number {
  return totalLaborHours > 0 ? (billableLaborHours / totalLaborHours) * 100 : 0;
}
