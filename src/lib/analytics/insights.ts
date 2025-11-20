/**
 * AI-powered business insights and recommendations
 * COMPETITIVE ADVANTAGE: Automated intelligence - Big 3 don't have this!
 */

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'warning' | 'opportunity' | 'neutral';
  category: 'revenue' | 'customers' | 'operations' | 'efficiency' | 'growth';
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  action?: string;
  metric?: { label: string; value: string | number };
  icon?: string;
}

interface AnalyticsSnapshot {
  revenue: {
    total: number;
    growth: { mom: number; yoy: number };
    avgEstimateValue: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    churnRate: number;
    ltv: number;
  };
  operations: {
    conversionRate: number;
    cycleTime: number;
    capacityUtilization: number;
    supplementRate: number;
    supplementApprovalRate: number;
  };
}

/**
 * Detect insights from analytics data
 */
export function detectInsights(data: AnalyticsSnapshot): Insight[] {
  const insights: Insight[] = [];

  // Revenue insights
  insights.push(...analyzeRevenue(data.revenue));

  // Customer insights
  insights.push(...analyzeCustomers(data.customers));

  // Operational insights
  insights.push(...analyzeOperations(data.operations));

  // Sort by impact and return top 10
  return insights
    .sort((a, b) => {
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    })
    .slice(0, 10);
}

/**
 * Analyze revenue metrics
 */
function analyzeRevenue(revenue: AnalyticsSnapshot['revenue']): Insight[] {
  const insights: Insight[] = [];

  // Strong growth
  if (revenue.growth.mom > 15) {
    insights.push({
      id: 'revenue-growth-strong',
      type: 'positive',
      category: 'revenue',
      title: 'Excellent Revenue Growth! 🎉',
      description: `Revenue is up ${revenue.growth.mom.toFixed(1)}% compared to last month. Keep up the great work!`,
      impact: 'high',
      metric: { label: 'MoM Growth', value: `+${revenue.growth.mom.toFixed(1)}%` },
      icon: '📈',
    });
  }

  // Declining revenue
  if (revenue.growth.mom < -10) {
    insights.push({
      id: 'revenue-decline',
      type: 'negative',
      category: 'revenue',
      title: 'Revenue Declining',
      description: `Revenue is down ${Math.abs(revenue.growth.mom).toFixed(1)}% vs last month. Time to take action.`,
      impact: 'critical',
      action: 'Review marketing strategy, follow up with past customers, check competitor pricing',
      metric: { label: 'MoM Change', value: `${revenue.growth.mom.toFixed(1)}%` },
      icon: '📉',
    });
  }

  // Moderate decline
  if (revenue.growth.mom > -10 && revenue.growth.mom < -5) {
    insights.push({
      id: 'revenue-slight-decline',
      type: 'warning',
      category: 'revenue',
      title: 'Revenue Trending Down',
      description: `Revenue is down ${Math.abs(revenue.growth.mom).toFixed(1)}% this month. Monitor closely.`,
      impact: 'medium',
      action: 'Increase marketing efforts, reach out to dormant customers',
      icon: '⚠️',
    });
  }

  // Strong YoY growth
  if (revenue.growth.yoy > 25) {
    insights.push({
      id: 'revenue-yoy-excellent',
      type: 'positive',
      category: 'growth',
      title: 'Exceptional Year-Over-Year Growth',
      description: `You are crushing it! Revenue is up ${revenue.growth.yoy.toFixed(0)}% vs last year.`,
      impact: 'high',
      action: 'Document what is working and scale it',
      metric: { label: 'YoY Growth', value: `+${revenue.growth.yoy.toFixed(0)}%` },
      icon: '🚀',
    });
  }

  // High average estimate value
  if (revenue.avgEstimateValue > 3000) {
    insights.push({
      id: 'high-estimate-value',
      type: 'positive',
      category: 'revenue',
      title: 'Premium Estimates',
      description: `Your average estimate value is $${revenue.avgEstimateValue.toLocaleString()}, above industry average.`,
      impact: 'medium',
      action: 'Maintain quality standards that justify premium pricing',
      icon: '💎',
    });
  }

  return insights;
}

/**
 * Analyze customer metrics
 */
function analyzeCustomers(customers: AnalyticsSnapshot['customers']): Insight[] {
  const insights: Insight[] = [];

  // High churn rate
  if (customers.churnRate > 40) {
    insights.push({
      id: 'high-churn',
      type: 'negative',
      category: 'customers',
      title: 'High Customer Churn',
      description: `${customers.churnRate.toFixed(0)}% of customers haven't returned. Focus on retention!`,
      impact: 'critical',
      action: 'Implement follow-up program, send satisfaction surveys, offer loyalty discounts',
      metric: { label: 'Churn Rate', value: `${customers.churnRate.toFixed(0)}%` },
      icon: '🚪',
    });
  }

  // Good retention
  if (customers.churnRate < 20) {
    insights.push({
      id: 'low-churn',
      type: 'positive',
      category: 'customers',
      title: 'Excellent Customer Retention',
      description: `Only ${customers.churnRate.toFixed(0)}% churn rate - your customers love you!`,
      impact: 'medium',
      action: 'Ask for referrals and reviews from happy customers',
      icon: '❤️',
    });
  }

  // High customer lifetime value
  if (customers.ltv > 5000) {
    insights.push({
      id: 'high-ltv',
      type: 'positive',
      category: 'customers',
      title: 'High Customer Lifetime Value',
      description: `Customers are worth $${customers.ltv.toLocaleString()} on average over their lifetime.`,
      impact: 'medium',
      action: 'You can afford to spend more on customer acquisition',
      metric: { label: 'LTV', value: `$${customers.ltv.toLocaleString()}` },
      icon: '💰',
    });
  }

  // Low new customer acquisition
  const newCustomerRate = (customers.new / customers.total) * 100;
  if (newCustomerRate < 20 && customers.total > 50) {
    insights.push({
      id: 'low-acquisition',
      type: 'warning',
      category: 'customers',
      title: 'Low New Customer Acquisition',
      description: `Only ${newCustomerRate.toFixed(0)}% of customers are new. Increase marketing efforts.`,
      impact: 'high',
      action: 'Invest in digital ads, referral programs, and local SEO',
      icon: '📣',
    });
  }

  // Healthy new/returning balance
  const returningRate = (customers.returning / customers.total) * 100;
  if (returningRate > 30 && returningRate < 60) {
    insights.push({
      id: 'balanced-customers',
      type: 'positive',
      category: 'customers',
      title: 'Healthy Customer Mix',
      description: `Great balance of new (${newCustomerRate.toFixed(0)}%) and returning (${returningRate.toFixed(0)}%) customers.`,
      impact: 'low',
      icon: '⚖️',
    });
  }

  return insights;
}

/**
 * Analyze operational metrics
 */
function analyzeOperations(ops: AnalyticsSnapshot['operations']): Insight[] {
  const insights: Insight[] = [];

  // Excellent conversion rate
  if (ops.conversionRate > 80) {
    insights.push({
      id: 'high-conversion',
      type: 'positive',
      category: 'efficiency',
      title: 'Outstanding Conversion Rate',
      description: `${ops.conversionRate.toFixed(0)}% of estimates convert to jobs - well above industry average!`,
      impact: 'high',
      action: 'Document your sales process as a best practice',
      metric: { label: 'Conversion', value: `${ops.conversionRate.toFixed(0)}%` },
      icon: '🎯',
    });
  }

  // Low conversion rate
  if (ops.conversionRate < 50) {
    insights.push({
      id: 'low-conversion',
      type: 'negative',
      category: 'efficiency',
      title: 'Low Conversion Rate',
      description: `Only ${ops.conversionRate.toFixed(0)}% of estimates become jobs. Industry average is 65-75%.`,
      impact: 'critical',
      action: 'Review pricing strategy, improve estimate quality, follow up faster',
      metric: { label: 'Conversion', value: `${ops.conversionRate.toFixed(0)}%` },
      icon: '❌',
    });
  }

  // Near capacity
  if (ops.capacityUtilization > 85) {
    insights.push({
      id: 'near-capacity',
      type: 'warning',
      category: 'operations',
      title: 'Approaching Capacity Limit',
      description: `Shop is at ${ops.capacityUtilization.toFixed(0)}% capacity. Consider expanding.`,
      impact: 'high',
      action: 'Hire additional techs, extend hours, or increase prices',
      metric: { label: 'Capacity', value: `${ops.capacityUtilization.toFixed(0)}%` },
      icon: '🏗️',
    });
  }

  // Under-capacity
  if (ops.capacityUtilization < 50) {
    insights.push({
      id: 'under-capacity',
      type: 'opportunity',
      category: 'operations',
      title: 'Excess Capacity Available',
      description: `Shop is only ${ops.capacityUtilization.toFixed(0)}% utilized. Room to grow!`,
      impact: 'medium',
      action: 'Ramp up marketing, accept more insurance partnerships',
      icon: '📊',
    });
  }

  // Fast cycle time
  if (ops.cycleTime < 3) {
    insights.push({
      id: 'fast-cycle-time',
      type: 'positive',
      category: 'efficiency',
      title: 'Excellent Turnaround Time',
      description: `Average ${ops.cycleTime.toFixed(1)} day cycle time - customers will love this!`,
      impact: 'medium',
      action: 'Highlight fast service in marketing materials',
      metric: { label: 'Cycle Time', value: `${ops.cycleTime.toFixed(1)} days` },
      icon: '⚡',
    });
  }

  // Slow cycle time
  if (ops.cycleTime > 7) {
    insights.push({
      id: 'slow-cycle-time',
      type: 'warning',
      category: 'efficiency',
      title: 'Long Cycle Time',
      description: `${ops.cycleTime.toFixed(1)} day average is slower than industry standard (4-5 days).`,
      impact: 'high',
      action: 'Identify bottlenecks, improve parts delivery, optimize workflow',
      metric: { label: 'Cycle Time', value: `${ops.cycleTime.toFixed(1)} days` },
      icon: '🐌',
    });
  }

  // High supplement approval rate
  if (ops.supplementApprovalRate > 85 && ops.supplementRate > 10) {
    insights.push({
      id: 'high-supplement-approval',
      type: 'positive',
      category: 'efficiency',
      title: 'Excellent Supplement Approval Rate',
      description: `${ops.supplementApprovalRate.toFixed(0)}% of supplements get approved - great documentation!`,
      impact: 'medium',
      action: 'Continue thorough photo documentation',
      icon: '✅',
    });
  }

  // Low supplement approval
  if (ops.supplementApprovalRate < 60 && ops.supplementRate > 15) {
    insights.push({
      id: 'low-supplement-approval',
      type: 'warning',
      category: 'operations',
      title: 'Low Supplement Approval Rate',
      description: `Only ${ops.supplementApprovalRate.toFixed(0)}% of supplements are approved. Improve documentation.`,
      impact: 'medium',
      action: 'Take better photos, provide detailed explanations, follow up with adjusters',
      icon: '📸',
    });
  }

  return insights;
}

/**
 * Generate natural language business summary
 */
export function generateBusinessSummary(data: AnalyticsSnapshot): string {
  const parts: string[] = [];

  // Overall performance
  if (data.revenue.growth.mom > 10) {
    parts.push('Your shop is performing exceptionally well');
  } else if (data.revenue.growth.mom > 0) {
    parts.push('Your shop is performing well');
  } else if (data.revenue.growth.mom > -10) {
    parts.push('Your shop performance is stable');
  } else {
    parts.push('Your shop needs attention');
  }

  // Revenue trend
  if (Math.abs(data.revenue.growth.mom) > 5) {
    parts.push(
      `with revenue ${data.revenue.growth.mom > 0 ? 'up' : 'down'} ${Math.abs(
        data.revenue.growth.mom
      ).toFixed(0)}% this month`
    );
  }

  // Customer health
  if (data.customers.churnRate < 25) {
    parts.push('Strong customer retention is driving sustainable growth');
  } else if (data.customers.churnRate > 40) {
    parts.push('High customer churn is a concern that needs immediate attention');
  }

  // Operational efficiency
  if (data.operations.conversionRate > 75) {
    parts.push(`Excellent ${data.operations.conversionRate.toFixed(0)}% conversion rate`);
  } else if (data.operations.conversionRate < 55) {
    parts.push('Conversion rate could be improved');
  }

  // Capacity situation
  if (data.operations.capacityUtilization > 85) {
    parts.push('Consider expanding capacity to handle demand');
  } else if (data.operations.capacityUtilization < 50) {
    parts.push('You have capacity to take on more work');
  }

  return parts.join('. ') + '.';
}

/**
 * Generate actionable recommendations
 */
export function generateRecommendations(data: AnalyticsSnapshot): string[] {
  const recommendations: string[] = [];

  // Revenue recommendations
  if (data.revenue.growth.mom < -5) {
    recommendations.push('💡 Increase marketing spend to boost customer acquisition');
    recommendations.push('💡 Follow up with dormant customers for repeat business');
  }

  if (data.revenue.avgEstimateValue < 2000) {
    recommendations.push('💡 Review pricing - you may be undercharging for quality work');
  }

  // Customer recommendations
  if (data.customers.churnRate > 30) {
    recommendations.push('💡 Implement post-repair follow-up calls to improve retention');
    recommendations.push('💡 Send satisfaction surveys to identify improvement areas');
  }

  const newCustomerRate = (data.customers.new / data.customers.total) * 100;
  if (newCustomerRate < 25 && data.customers.total > 50) {
    recommendations.push('💡 Launch referral program - $50 credit for each new customer referred');
  }

  // Operational recommendations
  if (data.operations.conversionRate < 65) {
    recommendations.push('💡 Speed up estimate turnaround time - respond within 2 hours');
    recommendations.push('💡 Add payment plans to make estimates more accessible');
  }

  if (data.operations.cycleTime > 6) {
    recommendations.push('💡 Audit workflow for bottlenecks in parts delivery or paint time');
  }

  if (data.operations.capacityUtilization > 85) {
    recommendations.push('💡 Hire 1-2 additional technicians to handle growing demand');
    recommendations.push('💡 Alternatively, increase prices by 10% to manage demand');
  }

  if (data.operations.capacityUtilization < 50) {
    recommendations.push('💡 Run targeted Google Ads campaign to fill excess capacity');
  }

  // Return top 5 most relevant
  return recommendations.slice(0, 5);
}
