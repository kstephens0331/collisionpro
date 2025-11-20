"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import DateRangeSelector from "@/components/analytics/DateRangeSelector";
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Settings,
  Box,
  FileText,
  Brain,
} from "lucide-react";

// Lazy load dashboard components to avoid SSR issues
const RevenueDashboard = dynamic(
  () => import("@/components/analytics/RevenueDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

const CustomerDashboard = dynamic(
  () => import("@/components/analytics/CustomerDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

const OperationsDashboard = dynamic(
  () => import("@/components/analytics/OperationsDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

const ThreeDViewerAnalytics = dynamic(
  () => import("@/components/analytics/ThreeDViewerAnalytics"),
  { ssr: false }
);

const SupplementAnalytics = dynamic(
  () => import("@/components/analytics/SupplementAnalytics"),
  { ssr: false }
);

const AIInsightsDashboard = dynamic(
  () => import("@/components/analytics/AIInsightsDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    ),
  }
);

export default function AnalyticsContent() {
  const [dateRange, setDateRange] = useState<string>("last30Days");
  const [activeTab, setActiveTab] = useState<string>("overview");

  const handleExport = async (format: "pdf" | "csv") => {
    try {
      const response = await fetch(
        `/api/analytics/export?type=${format}&preset=${dateRange}&shopId=shop_demo`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-report-${dateRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Business intelligence and performance insights
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <DateRangeSelector
            selectedRange={dateRange}
            onRangeChange={setDateRange}
          />
        </CardContent>
      </Card>

      {/* Tabbed Analytics Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="ai-insights" className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50">
            <Brain className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-purple-600">AI Insights</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Revenue
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="3d-viewer" className="flex items-center gap-2">
            <Box className="h-4 w-4" />
            3D Viewer
          </TabsTrigger>
          <TabsTrigger value="supplements" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Supplements
          </TabsTrigger>
        </TabsList>

        {/* AI Insights Tab - FIRST! */}
        <TabsContent value="ai-insights" className="space-y-4">
          <AIInsightsDashboard dateRange={dateRange} />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                High-level summary of all key metrics across your shop.
              </p>
              {/* Overview will show combined insights from all tabs */}
              <RevenueDashboard dateRange={dateRange} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <RevenueDashboard dateRange={dateRange} />
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4">
          <CustomerDashboard dateRange={dateRange} />
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-4">
          <OperationsDashboard dateRange={dateRange} />
        </TabsContent>

        {/* 3D Viewer Analytics Tab */}
        <TabsContent value="3d-viewer" className="space-y-4">
          <ThreeDViewerAnalytics />
        </TabsContent>

        {/* Supplements Tab */}
        <TabsContent value="supplements" className="space-y-4">
          <SupplementAnalytics />
        </TabsContent>
      </Tabs>

      {/* Quick Stats Footer */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-lg font-semibold">
                {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date Range</p>
              <p className="text-lg font-semibold capitalize">
                {dateRange.replace(/([A-Z])/g, " $1").trim()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Shop ID</p>
              <p className="text-lg font-semibold">shop_demo</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Data Source</p>
              <p className="text-lg font-semibold">Real-time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
