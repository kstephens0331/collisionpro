"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Info,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

// Analytics data types
interface DamagePattern {
  type: string;
  count: number;
  percentage: number;
  avgConfidence: number;
}

interface PanelStats {
  location: string;
  count: number;
  percentage: number;
  avgRepairCost: number;
}

interface AIAnalytics {
  totalAnalyses: number;
  totalDamagesDetected: number;
  avgConfidence: number;
  avgProcessingTime: number;
  vehicleDetectionRate: number;
  manualOverrideRate: number;
  estimatedTimeSavings: number;
  estimatedCostSavings: number;
  damagePatterns: DamagePattern[];
  panelStats: PanelStats[];
  weeklyTrend: { week: string; analyses: number; accuracy: number }[];
  accuracyByType: { type: string; accuracy: number; samples: number }[];
}

export default function AIInsightsContent() {
  const [analytics, setAnalytics] = useState<AIAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ai/analytics?range=${dateRange}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      } else {
        // Use demo data if API not available
        setAnalytics(getDemoAnalytics());
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setAnalytics(getDemoAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // Format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-gray-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          Loading AI insights...
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
          <p className="text-gray-500">Start analyzing damage photos to see insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-7 w-7 text-blue-600" />
            AI Insights Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Analytics and performance metrics for AI damage detection
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["7d", "30d", "90d", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  dateRange === range
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {range === "all" ? "All Time" : range.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Demo Mode Notice */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-medium">Demo Mode:</span> Showing sample analytics data.
          Configure Google Cloud Vision API and start analyzing images to see real metrics.
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyses */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Analyses</p>
                <h3 className="text-2xl font-bold mt-1">{analytics.totalAnalyses}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUp className="h-3 w-3" />
              <span>12% from last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Confidence */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
                <h3 className="text-2xl font-bold mt-1">{formatPercent(analytics.avgConfidence)}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Target className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUp className="h-3 w-3" />
              <span>3.2% improvement</span>
            </div>
          </CardContent>
        </Card>

        {/* Time Savings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Time Saved</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatTime(analytics.estimatedTimeSavings)}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              ~{Math.round(analytics.estimatedTimeSavings / analytics.totalAnalyses)} min per estimate
            </p>
          </CardContent>
        </Card>

        {/* Cost Savings */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Cost Savings</p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(analytics.estimatedCostSavings)}
                </h3>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <DollarSign className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Based on reduced labor time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detection Metrics & ROI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Detection Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Vehicle Detection Rate */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Vehicle Detection Rate</span>
                <span className="font-medium">{formatPercent(analytics.vehicleDetectionRate)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${analytics.vehicleDetectionRate}%` }}
                />
              </div>
            </div>

            {/* Avg Processing Time */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Avg Processing Time</span>
                <span className="font-medium">{analytics.avgProcessingTime}ms</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${Math.min((3000 - analytics.avgProcessingTime) / 30, 100)}%` }}
                />
              </div>
            </div>

            {/* Manual Override Rate */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Manual Override Rate</span>
                <span className="font-medium">{formatPercent(analytics.manualOverrideRate)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full"
                  style={{ width: `${analytics.manualOverrideRate}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lower is better - indicates AI accuracy
              </p>
            </div>

            {/* Damages per Image */}
            <div className="pt-3 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Damages per Image</span>
                <span className="font-medium">
                  {(analytics.totalDamagesDetected / analytics.totalAnalyses).toFixed(1)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              ROI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Time Savings Breakdown */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3">Time Savings Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manual inspection time saved</span>
                    <span>{formatTime(Math.round(analytics.estimatedTimeSavings * 0.4))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parts lookup time saved</span>
                    <span>{formatTime(Math.round(analytics.estimatedTimeSavings * 0.35))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operations mapping saved</span>
                    <span>{formatTime(Math.round(analytics.estimatedTimeSavings * 0.25))}</span>
                  </div>
                </div>
              </div>

              {/* Efficiency Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(analytics.estimatedTimeSavings / 60)}h
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Hours Saved This Period
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(analytics.estimatedCostSavings / analytics.totalAnalyses)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Avg Savings Per Estimate
                  </div>
                </div>
              </div>

              {/* Projected Annual */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-700">Projected Annual ROI</span>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(analytics.estimatedCostSavings * 12)}
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  Based on current usage patterns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Damage Patterns & Panel Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Common Damage Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-600" />
              Common Damage Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.damagePatterns.map((pattern, index) => (
                <div key={pattern.type} className="flex items-center gap-3">
                  <div className="w-8 text-sm text-gray-500 font-medium">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium capitalize">
                        {pattern.type.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {pattern.count} ({formatPercent(pattern.percentage)})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${pattern.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg confidence: {formatPercent(pattern.avgConfidence)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Panel Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Most Affected Panels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.panelStats.map((panel, index) => (
                <div key={panel.location} className="flex items-center gap-3">
                  <div className="w-8 text-sm text-gray-500 font-medium">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium capitalize">
                        {panel.location.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {panel.count} ({formatPercent(panel.percentage)})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${panel.percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Avg repair cost: {formatCurrency(panel.avgRepairCost)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy by Damage Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Detection Accuracy by Damage Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {analytics.accuracyByType.map((item) => (
              <div
                key={item.type}
                className="text-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercent(item.accuracy)}
                </div>
                <div className="text-sm font-medium capitalize mt-1">
                  {item.type.replace("_", " ")}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.samples} samples
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Weekly Analysis Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.weeklyTrend.map((week) => (
              <div key={week.week} className="flex-1 flex flex-col items-center">
                <div className="text-xs text-gray-500 mb-2">
                  {formatPercent(week.accuracy)}
                </div>
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{
                    height: `${(week.analyses / Math.max(...analytics.weeklyTrend.map(w => w.analyses))) * 180}px`,
                  }}
                />
                <div className="text-xs text-gray-500 mt-2">{week.week}</div>
                <div className="text-xs font-medium">{week.analyses}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generate demo analytics data
 */
function getDemoAnalytics(): AIAnalytics {
  return {
    totalAnalyses: 247,
    totalDamagesDetected: 612,
    avgConfidence: 87.3,
    avgProcessingTime: 1340,
    vehicleDetectionRate: 96.4,
    manualOverrideRate: 8.2,
    estimatedTimeSavings: 1235, // minutes
    estimatedCostSavings: 12350,
    damagePatterns: [
      { type: "dent", count: 189, percentage: 30.9, avgConfidence: 89.2 },
      { type: "scratch", count: 156, percentage: 25.5, avgConfidence: 91.4 },
      { type: "paint_damage", count: 98, percentage: 16.0, avgConfidence: 85.7 },
      { type: "crack", count: 67, percentage: 10.9, avgConfidence: 88.3 },
      { type: "bumper_damage", count: 54, percentage: 8.8, avgConfidence: 84.6 },
      { type: "broken", count: 48, percentage: 7.8, avgConfidence: 92.1 },
    ],
    panelStats: [
      { location: "front_bumper", count: 87, percentage: 35.2, avgRepairCost: 485 },
      { location: "rear_bumper", count: 56, percentage: 22.7, avgRepairCost: 420 },
      { location: "left_fender", count: 42, percentage: 17.0, avgRepairCost: 380 },
      { location: "hood", count: 31, percentage: 12.6, avgRepairCost: 650 },
      { location: "right_fender", count: 31, percentage: 12.6, avgRepairCost: 380 },
    ],
    weeklyTrend: [
      { week: "W1", analyses: 28, accuracy: 84.5 },
      { week: "W2", analyses: 35, accuracy: 85.2 },
      { week: "W3", analyses: 42, accuracy: 86.8 },
      { week: "W4", analyses: 51, accuracy: 87.9 },
    ],
    accuracyByType: [
      { type: "scratch", accuracy: 91.4, samples: 156 },
      { type: "broken", accuracy: 92.1, samples: 48 },
      { type: "dent", accuracy: 89.2, samples: 189 },
      { type: "crack", accuracy: 88.3, samples: 67 },
      { type: "paint", accuracy: 85.7, samples: 98 },
    ],
  };
}
