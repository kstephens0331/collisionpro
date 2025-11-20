"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface DateRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

const PRESET_RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last7Days", label: "Last 7 Days" },
  { value: "last30Days", label: "Last 30 Days" },
  { value: "last90Days", label: "Last 90 Days" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisYear", label: "This Year" },
  { value: "allTime", label: "All Time" },
];

export default function DateRangeSelector({
  selectedRange,
  onRangeChange,
}: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Calendar className="h-4 w-4 text-gray-500" />
      {PRESET_RANGES.map((range) => (
        <Button
          key={range.value}
          size="sm"
          variant={selectedRange === range.value ? "default" : "outline"}
          onClick={() => onRangeChange(range.value)}
          className="text-xs"
        >
          {range.label}
        </Button>
      ))}
    </div>
  );
}
