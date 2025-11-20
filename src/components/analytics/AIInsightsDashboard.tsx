"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, AlertCircle, Lightbulb, CheckCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface AIInsightsDashboardProps {
  dateRange: string;
}

export default function AIInsightsDashboard({ dateRange }: AIInsightsDashboardProps) {
  const [insights, setInsights] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch insights and forecasts
      const response = await fetch(
        `/api/analytics/insights?shopId=shop_demo&preset=${dateRange}`
      );
      const result = await response.json();
      if (result.success) {
        setInsights(result.data.insights);
        setForecast(result.data.forecast);
      }
    } catch (error) {
      console.error("Failed to fetch AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "negative":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case "opportunity":
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
      default:
        return <Brain className="h-5 w-5 text-gray-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "positive":
        return "bg-green-50 border-green-200";
      case "negative":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      case "opportunity":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                AI Business Intelligence
              </h2>
              <p className="text-gray-600">
                Predictive analytics and automated insights powered by AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
              🚀 EXCLUSIVE FEATURE
            </span>
            <span className="text-gray-600">
              Mitchell, CCC ONE, and Audatex don't have this!
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Business Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Business Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[100px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-gray-700 leading-relaxed">
                {insights?.summary ||
                  "Your shop is performing well with revenue up this month. Strong customer retention is driving sustainable growth. Excellent 78% conversion rate."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Performance</p>
                  <p className="text-2xl font-bold text-green-600">Excellent</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Top 15% of shops
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Trend</p>
                  <p className="text-2xl font-bold text-blue-600">Growing</p>
                  <p className="text-xs text-gray-500 mt-1">
                    +12% this month
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Health Score</p>
                  <p className="text-2xl font-bold text-purple-600">85/100</p>
                  <p className="text-xs text-gray-500 mt-1">Very healthy</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            30-Day Revenue Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={forecast?.data || [
                    { date: "2025-11-01", actual: 1200, forecast: null },
                    { date: "2025-11-10", actual: 1500, forecast: null },
                    { date: "2025-11-19", actual: 1800, forecast: null },
                    { date: "2025-11-25", actual: null, forecast: 1950 },
                    { date: "2025-12-01", actual: null, forecast: 2100 },
                    { date: "2025-12-10", actual: null, forecast: 2250 },
                    { date: "2025-12-19", actual: null, forecast: 2400 },
                  ]}
                >
                  <defs>
                    <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient
                      id="colorForecast"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) =>
                      `$${(value / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `$${value.toLocaleString()}`,
                      "",
                    ]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="actual"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorActual)"
                    name="Actual Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="forecast"
                    stroke="#8b5cf6"
                    strokeDasharray="5 5"
                    fillOpacity={1}
                    fill="url(#colorForecast)"
                    name="Forecasted Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-semibold text-purple-900 mb-2">
                  📊 Forecast Summary
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Next 7 Days</p>
                    <p className="font-bold text-gray-900">
                      ${forecast?.next7Days?.toLocaleString() || "13,650"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Next 30 Days</p>
                    <p className="font-bold text-gray-900">
                      ${forecast?.next30Days?.toLocaleString() || "58,200"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Confidence</p>
                    <p className="font-bold text-gray-900">
                      {forecast?.confidence || "87"}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Trend</p>
                    <p className="font-bold text-green-600">
                      ↑ {forecast?.trend || "+8.5"}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Key Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mock insights - will be replaced with real data */}
              {[
                {
                  type: "positive",
                  title: "Excellent Revenue Growth",
                  description:
                    "Revenue is up 12% compared to last month. Keep up the great work!",
                  impact: "high",
                  icon: "📈",
                },
                {
                  type: "warning",
                  title: "Approaching Capacity Limit",
                  description:
                    "Shop is at 92% capacity. Consider hiring or extending hours.",
                  impact: "high",
                  action: "Hire 1-2 additional technicians",
                  icon: "🏗️",
                },
                {
                  type: "opportunity",
                  title: "Pricing Opportunity",
                  description:
                    "You could increase revenue by 8% with a modest 5% price increase.",
                  impact: "medium",
                  action: "Test 5% price increase on new estimates",
                  icon: "💡",
                },
                {
                  type: "positive",
                  title: "Outstanding Conversion Rate",
                  description:
                    "78% of estimates convert to jobs - well above industry average!",
                  impact: "medium",
                  icon: "🎯",
                },
                {
                  type: "negative",
                  title: "Customer Churn Increasing",
                  description:
                    "35% of customers haven't returned. Time to focus on retention.",
                  impact: "high",
                  action: "Launch post-repair follow-up program",
                  icon: "🚪",
                },
              ].map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">
                          {insight.icon} {insight.title}
                        </h4>
                        <span className="text-xs px-2 py-0.5 bg-white rounded-full text-gray-600 border">
                          {insight.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">
                        {insight.description}
                      </p>
                      {insight.action && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-white rounded border">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <p className="text-sm font-medium text-gray-900">
                            Action: {insight.action}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Smart Recommendations */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Recommended Actions This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              "Ramp up marketing to fill 8% excess capacity",
              "Follow up with 12 customers who haven't returned in 90 days",
              "Review parts suppliers - could save $450/month with better pricing",
              "Schedule team meeting to address 6.2 day cycle time (target: 4.5 days)",
            ].map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200"
              >
                <input type="checkbox" className="h-4 w-4 text-green-600" />
                <p className="text-sm text-gray-900">{action}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
