"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarRange, TrendingUp, Clock } from "lucide-react";

interface StatsCardsProps {
  totalCount: number;
  currentInLibrary: number;
  start: string;
  end: string;
}

const cards = [
  {
    key: "total",
    title: "Period Total",
    icon: CalendarRange,
    gradient: "from-blue-500/10 to-blue-600/5",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    key: "current",
    title: "Currently in Library",
    icon: Users,
    gradient: "from-emerald-500/10 to-emerald-600/5",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
  },
  {
    key: "avgDaily",
    title: "Avg. Daily Visits",
    icon: TrendingUp,
    gradient: "from-violet-500/10 to-violet-600/5",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    key: "peakTime",
    title: "Period Range",
    icon: Clock,
    gradient: "from-amber-500/10 to-amber-600/5",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
  },
];

export function StatsCards({
  totalCount,
  currentInLibrary,
  start,
  end,
}: StatsCardsProps) {
  const startDate = new Date(start).toLocaleDateString();
  const endDate = new Date(end).toLocaleDateString();
  const daysDiff = Math.max(
    1,
    Math.ceil(
      (new Date(end).getTime() - new Date(start).getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
  const avgDaily = Math.round(totalCount / daysDiff);

  const values = [
    {
      value: totalCount.toLocaleString(),
      sub: `${startDate} - ${endDate}`,
    },
    { value: currentInLibrary.toLocaleString(), sub: "Without check-out" },
    { value: avgDaily.toLocaleString(), sub: `Over ${daysDiff} day${daysDiff > 1 ? "s" : ""}` },
    { value: `${daysDiff}d`, sub: `${startDate} - ${endDate}` },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.key}
            className="relative overflow-hidden animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${card.gradient}`}
            />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div
                className={`h-9 w-9 rounded-lg ${card.iconBg} flex items-center justify-center`}
              >
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold tracking-tight">
                {values[i].value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {values[i].sub}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
