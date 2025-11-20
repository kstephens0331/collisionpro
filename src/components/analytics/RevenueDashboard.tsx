"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "./KPICard";
import { DollarSign, TrendingUp, FileText, Users } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueDashboardProps {
  dateRange: string;
}

export default function RevenueDashboard({ dateRange }: RevenueDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/revenue?shopId=shop_demo&preset=${dateRange}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare pie chart data
  const pieData = data?.revenueBySource
    ? [
        { name: "Insurance", value: data.revenueBySource.insurance, color: "#3b82f6" },
        { name: "Cash", value: data.revenueBySource.cash, color: "#10b981" },
        { name: "Warranty", value: data.revenueBySource.warranty, color: "#f59e0b" },
        { name: "Other", value: data.revenueBySource.other, color: "#6b7280" },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue"
          value={data?.totalRevenue || 0}
          format="currency"
          change={data?.growth?.mom}
          changeLabel="vs last month"
          icon={<DollarSign className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="Avg Estimate Value"
          value={data?.avgEstimateValue || 0}
          format="currency"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="Total Estimates"
          value={data?.estimateCount || 0}
          format="number"
          icon={<FileText className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="YoY Growth"
          value={data?.growth?.yoy || 0}
          format="percentage"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.revenueByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                />
                <YAxis
                  tickFormatter={(value) => {
                    if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                    return `$${value}`;
                  }}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `$${value.toLocaleString()}`,
                    "Revenue",
                  ]}
                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                  name="Daily Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Source & Monthly Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Source (Pie Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Revenue (Bar Chart) */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data?.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => {
                      const [year, month] = value.split("-");
                      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                      return monthNames[parseInt(month) - 1];
                    }}
                  />
                  <YAxis
                    tickFormatter={(value) => {
                      if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                      return `$${value}`;
                    }}
                  />
                  <Tooltip
                    formatter={(value: any) => [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
