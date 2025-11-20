"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "./KPICard";
import { Activity, Clock, FileText, TrendingUp, Package } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface OperationsDashboardProps {
  dateRange: string;
}

export default function OperationsDashboard({ dateRange }: OperationsDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/operations?shopId=shop_demo&preset=${dateRange}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch operations data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare funnel data for chart
  const funnelData = data?.funnel
    ? [
        { name: "Draft", value: data.funnel.draft, fill: "#94a3b8" },
        { name: "Sent", value: data.funnel.sent, fill: "#3b82f6" },
        { name: "Approved", value: data.funnel.approved, fill: "#10b981" },
        { name: "Completed", value: data.funnel.completed, fill: "#059669" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Conversion Rate"
          value={data?.conversionRate || 0}
          format="percentage"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="Avg Cycle Time"
          value={data?.avgCycleTime || 0}
          format="custom"
          customFormatter={(val) => `${val.toFixed(1)} days`}
          icon={<Clock className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="In Progress"
          value={data?.estimatesInProgress || 0}
          format="number"
          icon={<Activity className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="Capacity Usage"
          value={data?.capacityUtilization || 0}
          format="percentage"
          icon={<FileText className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* Estimate Funnel & Cycle Time Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Estimate Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Estimate Status Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : funnelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={funnelData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip
                    formatter={(value: any) => [value, "Estimates"]}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No funnel data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cycle Time Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Cycle Time Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : data?.cycleTimeByDay && data.cycleTimeByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.cycleTimeByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Days",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value.toFixed(1)} days`, "Cycle Time"]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgCycleTime"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                    name="Avg Cycle Time"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No cycle time data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Supplement Metrics & Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Supplement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Supplement Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Supplement Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(data?.supplementRate || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      % of estimates needing supplements
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Approval Rate</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(data?.supplementApprovalRate || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      % of supplements approved
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Parts Spending</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ${(data?.partsSpending || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Total parts orders this period
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Capacity Utilization</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {(data?.capacityUtilization || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Current workload vs max capacity
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Suppliers by Spend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : data?.topSuppliers && data.topSuppliers.length > 0 ? (
              <div className="space-y-3">
                {data.topSuppliers.map((supplier: any, index: number) => (
                  <div
                    key={supplier.name}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {supplier.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {supplier.orderCount} orders • {supplier.avgDeliveryTime.toFixed(1)} days avg
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ${supplier.totalSpend.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No supplier data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
