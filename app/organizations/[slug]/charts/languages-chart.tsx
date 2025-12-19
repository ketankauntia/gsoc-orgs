"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface LanguagesChartProps {
  data: Array<{ name: string; count: number }>;
}

export function LanguagesChart({ data }: LanguagesChartProps) {
  // Take top 10 and sort by count descending
  const chartData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No language data available
      </div>
    );
  }

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  // Color gradient from dark to light teal
  const getBarColor = (index: number) => {
    const colors = [
      "#0d9488", // teal-600
      "#14b8a6", // teal-500
      "#2dd4bf", // teal-400
      "#5eead4", // teal-300
      "#99f6e4", // teal-200
      "#0d9488",
      "#14b8a6",
      "#2dd4bf",
      "#5eead4",
      "#99f6e4",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxCount]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: "#374151" }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [value, "Usage Weight"]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

