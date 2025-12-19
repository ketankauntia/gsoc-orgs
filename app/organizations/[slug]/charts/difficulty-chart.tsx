"use client";

import { cn } from "@/lib/utils";

interface DifficultyChartProps {
  data: Array<{ level: string; count: number }>;
}

export function DifficultyChart({ data }: DifficultyChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getBarColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-emerald-500";
      case "Intermediate":
        return "bg-amber-500";
      case "Advanced":
        return "bg-orange-600";
      default:
        return "bg-gray-400";
    }
  };

  const totalCount = data.reduce((acc, d) => acc + d.count, 0);

  if (totalCount === 0) {
    return (
      <div className="space-y-4">
        {["Beginner", "Intermediate", "Advanced"].map((level) => (
          <div key={level} className="flex items-center gap-4">
            <span className="w-28 text-sm font-medium">{level}</span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div className="h-full bg-gray-300 w-0" />
            </div>
            <span className="w-8 text-right text-sm font-semibold text-muted-foreground">
              0
            </span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground text-center mt-2">
          No difficulty data available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item) => {
        const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
        return (
          <div key={item.level} className="flex items-center gap-4">
            <span className="w-28 text-sm font-medium">{item.level}</span>
            <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
              <div
                className={cn("h-full transition-all duration-500", getBarColor(item.level))}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="w-8 text-right text-sm font-semibold">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

