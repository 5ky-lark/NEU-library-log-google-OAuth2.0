"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CalendarDays, CalendarRange, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export type DateFilter = "today" | "week" | "month" | "custom";

interface DateRangePickerProps {
  filter: DateFilter;
  onFilterChange: (filter: DateFilter) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
}

const filterButtons: { value: DateFilter; label: string; icon: React.ElementType }[] = [
  { value: "today", label: "Today", icon: Calendar },
  { value: "week", label: "This Week", icon: CalendarDays },
  { value: "month", label: "This Month", icon: CalendarRange },
  { value: "custom", label: "Custom", icon: SlidersHorizontal },
];

export function DateRangePicker({
  filter,
  onFilterChange,
  startDate = "",
  endDate = "",
  onStartDateChange,
  onEndDateChange,
}: DateRangePickerProps) {
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="inline-flex rounded-xl bg-muted/60 p-1 gap-0.5">
        {filterButtons.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.value}
              onClick={() => onFilterChange(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                filter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>
      {filter === "custom" && (
        <div className="flex gap-3 items-end animate-fade-in">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Start</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange?.(e.target.value)}
              max={today}
              className="w-[160px] h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">End</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange?.(e.target.value)}
              min={startDate}
              max={today}
              className="w-[160px] h-10"
            />
          </div>
        </div>
      )}
    </div>
  );
}
