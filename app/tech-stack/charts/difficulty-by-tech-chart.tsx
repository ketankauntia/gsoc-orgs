"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  LabelList,
} from "recharts";
import { getDifficultyChartColor } from "@/lib/theme";

interface DifficultyByTechChartProps {
  data: Array<{ level: string; count: number }>;
}

export function DifficultyByTechChart({ data }: DifficultyByTechChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
        No difficulty data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="level"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            angle={-15}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            domain={[0, Math.ceil(maxCount * 1.1)]}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [value.toLocaleString(), "Projects"]}
          />
          <Bar
            dataKey="count"
            radius={[4, 4, 0, 0]}
            maxBarSize={60}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getDifficultyChartColor(entry.level)} />
            ))}
            <LabelList
              dataKey="count"
              position="top"
              fill="#6b7280"
              fontSize={10}
              fontWeight={500}
              formatter={(value: number) => value > 0 ? value.toLocaleString() : ''}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

