"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number; // Percentage change (positive or negative)
  changeLabel?: string; // e.g., "vs last month"
  icon?: React.ReactNode;
  format?: "currency" | "number" | "percentage" | "custom";
  customFormatter?: (value: number) => string; // Custom formatter function
  loading?: boolean;
}

export default function KPICard({
  title,
  value,
  change,
  changeLabel = "vs last month",
  icon,
  format = "custom",
  customFormatter,
  loading = false,
}: KPICardProps) {
  // Format value based on type
  const formattedValue = () => {
    if (loading) return "...";

    // Use custom formatter if provided
    if (customFormatter && typeof value === "number") {
      return customFormatter(value);
    }

    if (format === "currency" && typeof value === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }

    if (format === "number" && typeof value === "number") {
      return new Intl.NumberFormat("en-US").format(value);
    }

    if (format === "percentage" && typeof value === "number") {
      return `${value.toFixed(1)}%`;
    }

    return value;
  };

  // Determine change color and icon
  const getChangeColor = () => {
    if (change === undefined || change === 0) return "text-gray-500";
    return change > 0 ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const formatChange = () => {
    if (change === undefined) return null;
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formattedValue()}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs mt-2 ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="font-medium">{formatChange()}</span>
            <span className="text-gray-500 ml-1">{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
