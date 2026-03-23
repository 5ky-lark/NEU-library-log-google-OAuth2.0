"use client";

import { useCallback, useEffect, useState } from "react";
import { StatsCards } from "@/components/stats-cards";
import { DateRangePicker, DateFilter } from "@/components/date-range-picker";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  COLLEGES,
  DASHBOARD_VISITOR_ROLES,
  DashboardVisitorRole,
  VISIT_REASONS,
} from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, PieChart as PieChartIcon } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function AdminDashboardPage() {
  const [filter, setFilter] = useState<DateFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [visitorRoleFilter, setVisitorRoleFilter] =
    useState<DashboardVisitorRole>("all");
  const [stats, setStats] = useState<{
    totalCount: number;
    byReason: { _id: string; count: number }[];
    byCollege: { _id: string; count: number }[];
    dailyBreakdown: { _id: string; count: number }[];
    start: string;
    end: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter === "custom" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    } else {
      params.set("filter", filter);
    }
    if (reasonFilter) {
      params.set("reason", reasonFilter);
    }
    if (collegeFilter.trim()) {
      params.set("college", collegeFilter.trim());
    }
    if (visitorRoleFilter !== "all") {
      params.set("visitorRole", visitorRoleFilter);
    }

    fetch(`/api/stats?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filter, startDate, endDate, reasonFilter, collegeFilter, visitorRoleFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = (f: DateFilter) => {
    setFilter(f);
    if (f !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  const topReasons = (stats?.byReason || []).slice(0, 3);
  const topColleges = (stats?.byCollege || []).slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of library visitor activity
        </p>
      </div>

      {/* Date Filter */}
      <DateRangePicker
        filter={filter}
        onFilterChange={handleFilterChange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Statistics</CardTitle>
          <CardDescription>Narrow down data by reason, college, or role</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="reason-filter">Reason for Visit</Label>
            <Select
              id="reason-filter"
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
            >
              <option value="">All reasons</option>
              {VISIT_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="college-filter">College</Label>
            <Select
              id="college-filter"
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
            >
              <option value="">All colleges</option>
              {COLLEGES.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visitor-role-filter">Visitor Role</Label>
            <Select
              id="visitor-role-filter"
              value={visitorRoleFilter}
              onChange={(e) =>
                setVisitorRoleFilter(e.target.value as DashboardVisitorRole)
              }
            >
              {DASHBOARD_VISITOR_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role === "all"
                    ? "All visitors"
                    : role === "student"
                    ? "Students"
                    : role === "teacher"
                    ? "Teachers"
                    : role === "staff"
                    ? "Staff"
                    : "Employees (Teacher/Staff)"}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-[130px] animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <>
          {/* Stats Cards */}
          <StatsCards
            totalCount={stats.totalCount}
            start={stats.start}
            end={stats.end}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top 3 Reasons</CardTitle>
                <CardDescription>Most common visit purposes</CardDescription>
              </CardHeader>
              <CardContent>
                {topReasons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-2">
                    {topReasons.map((item, index) => (
                      <div
                        key={`${item._id}-${index}`}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <span className="capitalize text-sm font-medium truncate">
                            {item._id}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {item.count} visit(s)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Top 3 Colleges</CardTitle>
                <CardDescription>Highest check-in volumes</CardDescription>
              </CardHeader>
              <CardContent>
                {topColleges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data</p>
                ) : (
                  <div className="space-y-2">
                    {topColleges.map((item, index) => (
                      <div
                        key={`${item._id}-${index}`}
                        className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium truncate">{item._id}</span>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {item.count} visit(s)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Daily Breakdown Chart */}
            <Card className="animate-fade-in stagger-1">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Visitors by Day</CardTitle>
                  <CardDescription>
                    Daily check-in count for the selected period
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {stats.dailyBreakdown.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No data for this period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.dailyBreakdown.map((d) => ({
                          date: d._id,
                          count: d.count,
                        }))}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          stroke="hsl(var(--muted-foreground))"
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow:
                              "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 10px 40px -8px rgb(0 0 0 / 0.12)",
                            fontSize: "13px",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="#3b82f6"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* By Reason Chart */}
            <Card className="animate-fade-in stagger-2">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <CardTitle className="text-base">By Reason</CardTitle>
                  <CardDescription>Visit purpose breakdown</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {stats.byReason.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                      No data for this period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.byReason.map((r, i) => ({
                            name:
                              r._id.charAt(0).toUpperCase() + r._id.slice(1),
                            value: r.count,
                            fill: COLORS[i % COLORS.length],
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {stats.byReason.map((_, i) => (
                            <Cell
                              key={`cell-${i}`}
                              fill={COLORS[i % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid hsl(var(--border))",
                            boxShadow:
                              "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 10px 40px -8px rgb(0 0 0 / 0.12)",
                            fontSize: "13px",
                          }}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "13px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Failed to load statistics. Please try again.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
