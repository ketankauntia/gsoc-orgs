"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface TopStacksChartProps {
  data: Array<{ name: string; slug: string; count: number }>;
}

export function TopStacksChart({ data }: TopStacksChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        No tech stack data available
      </div>
    );
  }

  // Take top 8 stacks
  const chartData = data.slice(0, 8);
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  // Teal gradient colors from dark to light
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
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
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
            tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
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
            formatter={(value: number) => [value, "Organizations"]}
          />
          <Bar 
            dataKey="count" 
            radius={[0, 4, 4, 0]} 
            maxBarSize={28}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              fill="#374151"
              fontSize={11}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

