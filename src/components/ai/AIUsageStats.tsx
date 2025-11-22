'use client';

/**
 * AI Usage Statistics Component
 *
 * Display AI assistant usage metrics and costs
 */

import { MessageSquare, Zap, DollarSign, TrendingUp } from 'lucide-react';

interface UsageStats {
  messagesCount: number;
  actionsExecuted: number;
  totalTokens: number;
  totalCost: number;
  conversationsStarted?: number;
  partSearches?: number;
  estimatesCreated?: number;
  reportsGenerated?: number;
}

interface AIUsageStatsProps {
  stats: UsageStats | null;
  period?: string;
}

export default function AIUsageStats({ stats, period = 'today' }: AIUsageStatsProps) {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Usage Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Messages',
      value: stats.messagesCount,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Actions',
      value: stats.actionsExecuted,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Tokens',
      value: stats.totalTokens.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Cost',
      value: `$${stats.totalCost.toFixed(4)}`,
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const actionBreakdown = [
    { label: 'Parts Searches', value: stats.partSearches || 0 },
    { label: 'Estimates Created', value: stats.estimatesCreated || 0 },
    { label: 'Reports Generated', value: stats.reportsGenerated || 0 },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">
          Usage Statistics
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({period})
          </span>
        </h2>
      </div>

      <div className="p-6">
        {/* Main Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric) => (
            <div key={metric.label} className={`${metric.bgColor} rounded-lg p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
                <span className="text-xs text-gray-600">{metric.label}</span>
              </div>
              <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Action Breakdown */}
        {stats.actionsExecuted > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Action Breakdown</h3>
            <div className="space-y-2">
              {actionBreakdown.map((action) => (
                <div key={action.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{action.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            stats.actionsExecuted > 0
                              ? (action.value / stats.actionsExecuted) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {action.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cost Estimate */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estimated monthly cost</span>
            <span className="font-semibold text-gray-900">
              ${(stats.totalCost * 30).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Based on current daily usage. Actual costs may vary.
          </p>
        </div>
      </div>
    </div>
  );
}
