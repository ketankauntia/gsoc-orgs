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
import {
  CHART_AXIS_COLOR,
  CHART_LABEL_COLOR,
  CHART_TOOLTIP_STYLE,
  getAtlasChartColor,
} from "./chart-theme";

interface MostSelectionsChartProps {
  data: Array<{
    name: string;
    total: number;
    byYear: Array<{ year: number; count: number }>;
  }>;
}

export function MostSelectionsChart({ data }: MostSelectionsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        No selection data available
      </div>
    );
  }

  // Take top 10
  const chartData = data.slice(0, 10)
  const maxCount = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
        >
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxCount]}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12, fill: CHART_LABEL_COLOR, fontWeight: 500 }}
            tickLine={false}
            axisLine={false}
            width={100}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value: number) => [value.toLocaleString(), "Selections"]}
          />
          <Bar 
            dataKey="total" 
            radius={[0, 4, 4, 0]} 
            maxBarSize={28}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getAtlasChartColor(index)} />
            ))}
            <LabelList
              dataKey="total"
              position="right"
              fill={CHART_LABEL_COLOR}
              fontSize={11}
              fontWeight={600}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
