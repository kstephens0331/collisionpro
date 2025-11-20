"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KPICard from "./KPICard";
import { Users, UserPlus, TrendingUp, Heart } from "lucide-react";
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
} from "recharts";

interface CustomerDashboardProps {
  dateRange: string;
}

export default function CustomerDashboard({ dateRange }: CustomerDashboardProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/customers?shopId=shop_demo&preset=${dateRange}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Customers"
          value={data?.totalCustomers || 0}
          format="number"
          icon={<Users className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="New Customers"
          value={data?.newCustomers || 0}
          format="number"
          icon={<UserPlus className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="Avg Lifetime Value"
          value={data?.avgLifetimeValue || 0}
          format="currency"
          icon={<TrendingUp className="h-4 w-4" />}
          loading={loading}
        />
        <KPICard
          title="Retention Rate"
          value={data?.retentionRate || 0}
          format="percentage"
          icon={<Heart className="h-4 w-4" />}
          loading={loading}
        />
      </div>

      {/* New vs Returning Customers Chart */}
      <Card>
        <CardHeader>
          <CardTitle>New vs Returning Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.newVsReturning || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value) => {
                    const [year, month] = value.split("-");
                    const monthNames = [
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ];
                    return monthNames[parseInt(month) - 1];
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="newCustomers"
                  fill="#3b82f6"
                  name="New Customers"
                  stackId="a"
                />
                <Bar
                  dataKey="returningCustomers"
                  fill="#10b981"
                  name="Returning Customers"
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Customer Metrics & Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Customer Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Metrics</CardTitle>
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
                    <p className="text-sm text-gray-600">New Customers</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {data?.newCustomers || 0}
                    </p>
                  </div>
                  <UserPlus className="h-8 w-8 text-blue-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Returning Customers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {data?.returningCustomers || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Retention Rate</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(data?.retentionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-purple-600" />
                </div>

                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Churn Rate</p>
                    <p className="text-2xl font-bold text-amber-600">
                      {(data?.churnRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-600" />
                </div>

                {data?.customerSatisfaction > 0 && (
                  <div className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Avg Satisfaction</p>
                      <p className="text-2xl font-bold text-rose-600">
                        {data.customerSatisfaction.toFixed(1)} / 5.0
                      </p>
                    </div>
                    <Heart className="h-8 w-8 text-rose-600" />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Customers by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : data?.topCustomers && data.topCustomers.length > 0 ? (
              <div className="space-y-3">
                {data.topCustomers.slice(0, 5).map((customer: any, index: number) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {customer.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {customer.estimateCount} estimates
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        ${customer.totalRevenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${customer.avgEstimateValue.toLocaleString()} avg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500">
                No customer data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
