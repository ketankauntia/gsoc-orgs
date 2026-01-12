"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell,
  LabelList,
} from "recharts";
import { getChartBarColor } from "@/lib/theme";

interface PopularityGrowthChartProps {
  data: Array<{
    name: string;
    percentIncrease: number;
    total: number;
    firstYear: number;
    lastYear: number;
    byYear: Array<{ year: number; count: number }>;
  }>;
}

export function PopularityGrowthChart({ data }: PopularityGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground text-sm">
        No growth data available
      </div>
    );
  }

  // Take top 8 for better visualization
  const chartData = data.slice(0, 8).map(item => ({
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    percentIncrease: Math.round(item.percentIncrease),
    total: item.total,
    firstYear: item.firstYear,
    lastYear: item.lastYear,
  }))

  const maxProjects = Math.max(...chartData.map((d) => d.total), 1)
  const maxPercent = Math.max(...chartData.map((d) => d.percentIncrease), 1)

  return (
    <div className="h-[450px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            domain={[0, Math.ceil(maxProjects * 1.1)]}
            label={{ value: 'Total Projects', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280', fontSize: '12px' } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 10, fill: "#f59e0b" }}
            tickLine={false}
            axisLine={false}
            domain={[0, Math.ceil(maxPercent * 1.1)]}
            label={{ value: 'Growth %', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#f59e0b', fontSize: '12px' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              if (name === 'total') return [value.toLocaleString(), 'Total Projects']
              if (name === 'percentIncrease') return [`${value}%`, 'Growth %']
              return [value, name]
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            yAxisId="left"
            dataKey="total"
            name="Total Projects"
            radius={[4, 4, 0, 0]}
            maxBarSize={50}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getChartBarColor(index)} />
            ))}
            <LabelList
              dataKey="total"
              position="top"
              fill="#374151"
              fontSize={10}
              fontWeight={500}
              formatter={(value: number) => value > 0 ? value.toLocaleString() : ''}
            />
          </Bar>
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="percentIncrease"
            name="Growth %"
            stroke="#f59e0b"
            strokeWidth={3}
            dot={{ fill: "#f59e0b", strokeWidth: 0, r: 5 }}
            activeDot={{ r: 7 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

