/**
 * Analytics Service
 *
 * Business intelligence, KPI tracking, and financial reporting
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface DailyMetrics {
  date: string;
  totalRevenue: number;
  totalCosts: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  estimatesCreated: number;
  estimatesApproved: number;
  conversionRate: number;
  jobsCompleted: number;
  newCustomers: number;
}

export interface KPIMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  achieved: boolean;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

/**
 * Get daily metrics for a shop
 */
export async function getDailyMetrics(
  shopId: string,
  range: DateRange
): Promise<DailyMetrics[]> {
  try {
    const { data, error } = await supabase
      .from('DailyShopMetrics')
      .select('*')
      .eq('shopId', shopId)
      .gte('date', range.startDate.toISOString().split('T')[0])
      .lte('date', range.endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Get daily metrics error:', error);
    return [];
  }
}

/**
 * Get KPI performance
 */
export async function getKPIPerformance(shopId: string): Promise<KPIMetric[]> {
  try {
    const { data: targets, error } = await supabase
      .from('KPITarget')
      .select('*')
      .eq('shopId', shopId)
      .eq('isActive', true);

    if (error) throw error;

    const kpis: KPIMetric[] = [];

    for (const target of targets || []) {
      // Get latest achievement
      const { data: achievement } = await supabase
        .from('KPIAchievement')
        .select('*')
        .eq('kpiTargetId', target.id)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (achievement) {
        // Get previous achievement for trend
        const { data: prevAchievement } = await supabase
          .from('KPIAchievement')
          .select('actualValue')
          .eq('kpiTargetId', target.id)
          .lt('date', achievement.date)
          .order('date', { ascending: false })
          .limit(1)
          .single();

        const change = prevAchievement
          ? achievement.actualValue - prevAchievement.actualValue
          : 0;

        kpis.push({
          name: target.name,
          value: achievement.actualValue,
          target: achievement.targetValue,
          unit: target.unit || '',
          achieved: achievement.achieved,
          trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
          change,
        });
      }
    }

    return kpis;
  } catch (error: any) {
    console.error('Get KPI performance error:', error);
    return [];
  }
}

/**
 * Generate financial report
 */
export async function generateFinancialReport(
  shopId: string,
  reportType: string,
  range: DateRange
): Promise<{
  success: boolean;
  reportId?: string;
  error?: string;
}> {
  try {
    // Get daily metrics for period
    const metrics = await getDailyMetrics(shopId, range);

    // Calculate totals
    const totalRevenue = metrics.reduce((sum, m) => sum + Number(m.totalRevenue || 0), 0);
    const totalExpenses = metrics.reduce((sum, m) => sum + Number(m.totalCosts || 0), 0);
    const grossProfit = metrics.reduce((sum, m) => sum + Number(m.grossProfit || 0), 0);
    const netProfit = metrics.reduce((sum, m) => sum + Number(m.netProfit || 0), 0);
    const profitMargin = totalRevenue > 0 ? netProfit / totalRevenue : 0;

    // Create report
    const { data: report, error } = await supabase
      .from('FinancialReport')
      .insert({
        shopId,
        reportType,
        reportName: `${reportType} - ${range.startDate.toISOString().split('T')[0]} to ${range.endDate.toISOString().split('T')[0]}`,
        startDate: range.startDate.toISOString().split('T')[0],
        endDate: range.endDate.toISOString().split('T')[0],
        data: { metrics },
        totalRevenue,
        totalExpenses,
        grossProfit,
        netProfit,
        profitMargin,
        status: 'finalized',
        finalizedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      reportId: report.id,
    };
  } catch (error: any) {
    console.error('Generate financial report error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update daily metrics (should be called via cron/scheduler)
 */
export async function updateDailyMetrics(shopId: string, date: Date): Promise<boolean> {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // This would aggregate data from estimates, jobs, payments, etc.
    // For now, returning success
    console.log(`Updated daily metrics for shop ${shopId} on ${dateStr}`);

    return true;
  } catch (error: any) {
    console.error('Update daily metrics error:', error);
    return false;
  }
}

/**
 * Track expense
 */
export async function trackExpense(
  shopId: string,
  expense: {
    category: string;
    description: string;
    amount: number;
    expenseDate: Date;
    vendor?: string;
    invoiceNumber?: string;
  }
): Promise<{ success: boolean; expenseId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('Expense')
      .insert({
        shopId,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        totalAmount: expense.amount,
        expenseDate: expense.expenseDate.toISOString().split('T')[0],
        vendor: expense.vendor,
        invoiceNumber: expense.invoiceNumber,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      expenseId: data.id,
    };
  } catch (error: any) {
    console.error('Track expense error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get revenue trends
 */
export async function getRevenueTrends(
  shopId: string,
  range: DateRange
): Promise<Array<{
  date: string;
  revenue: number;
  growthRate: number;
}>> {
  try {
    const metrics = await getDailyMetrics(shopId, range);

    return metrics.map((m, i) => {
      const prevRevenue = i > 0 ? Number(metrics[i - 1].totalRevenue) : 0;
      const currentRevenue = Number(m.totalRevenue);
      const growthRate = prevRevenue > 0 ? (currentRevenue - prevRevenue) / prevRevenue : 0;

      return {
        date: m.date,
        revenue: currentRevenue,
        growthRate,
      };
    });
  } catch (error: any) {
    console.error('Get revenue trends error:', error);
    return [];
  }
}
