"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarRange, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalCount: number;
  start: string;
  end: string;
}

function formatIsoDateRangeValue(value: string) {
  const [datePart] = value.split("T");
  if (!datePart) {
    return new Date(value).toLocaleDateString();
  }

  const [year, month, day] = datePart.split("-").map(Number);
  if (!year || !month || !day) {
    return new Date(value).toLocaleDateString();
  }

  return new Date(year, month - 1, day).toLocaleDateString();
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
    key: "avgDaily",
    title: "Avg. Daily Visits",
    icon: TrendingUp,
    gradient: "from-violet-500/10 to-violet-600/5",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
];

export function StatsCards({
  totalCount,
  start,
  end,
}: StatsCardsProps) {
  const startDate = formatIsoDateRangeValue(start);
  const endDate = formatIsoDateRangeValue(end);
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
    { value: avgDaily.toLocaleString(), sub: `Over ${daysDiff} day${daysDiff > 1 ? "s" : ""}` },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
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
