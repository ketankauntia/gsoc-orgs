"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  LabelList,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CHART_AXIS_COLOR,
  CHART_GRID_COLOR,
  CHART_LABEL_COLOR,
  CHART_TOOLTIP_STYLE,
  getAtlasChartColor,
} from "./chart-theme";

interface PopularityGrowthChartProps {
  data: Array<{
    name: string;
    percentIncrease: number;
    firstYearCount: number;
    lastYearCount: number;
  }>;
  comparisonStartYear: number;
  comparisonEndYear: number;
}

export function PopularityGrowthChart({
  data,
  comparisonStartYear,
  comparisonEndYear,
}: PopularityGrowthChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        No comparison data available
      </div>
    );
  }

  const chartData = data.slice(0, 8).map((item) => ({
    name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
    percentIncrease: Math.round(item.percentIncrease),
    firstYearCount: item.firstYearCount,
    lastYearCount: item.lastYearCount,
  }));
  const maxCount = Math.max(
    ...chartData.flatMap((item) => [
      item.firstYearCount,
      item.lastYearCount,
    ]),
    1,
  );
  const maxPercent = Math.max(
    ...chartData.map((item) => item.percentIncrease),
    1,
  );

  return (
    <div className="h-[460px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 20, right: 28, left: 0, bottom: 60 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_GRID_COLOR}
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
            tickLine={false}
            axisLine={false}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis
            yAxisId="count"
            tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
            tickLine={false}
            axisLine={false}
            domain={[0, Math.ceil(maxCount * 1.2)]}
            label={{
              value: "Organizations",
              angle: -90,
              position: "insideLeft",
              style: {
                textAnchor: "middle",
                fill: CHART_AXIS_COLOR,
                fontSize: "12px",
              },
            }}
          />
          <YAxis
            yAxisId="change"
            orientation="right"
            tick={{ fontSize: 10, fill: getAtlasChartColor(3) }}
            tickLine={false}
            axisLine={false}
            domain={[0, Math.ceil(maxPercent * 1.1)]}
            tickFormatter={(value) => `${value}%`}
            label={{
              value: "Change",
              angle: 90,
              position: "insideRight",
              style: {
                textAnchor: "middle",
                fill: getAtlasChartColor(3),
                fontSize: "12px",
              },
            }}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(value: number, name: string) => {
              if (name === "percentIncrease") {
                return [`${value}%`, "Relative change"];
              }
              if (name === "firstYearCount") {
                return [value.toLocaleString(), String(comparisonStartYear)];
              }
              if (name === "lastYearCount") {
                return [value.toLocaleString(), String(comparisonEndYear)];
              }
              return [value, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "20px" }}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => {
              if (value === "firstYearCount") return String(comparisonStartYear);
              if (value === "lastYearCount") return String(comparisonEndYear);
              return "Relative change";
            }}
          />
          <Bar
            yAxisId="count"
            dataKey="firstYearCount"
            name="firstYearCount"
            fill={getAtlasChartColor(2)}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            yAxisId="count"
            dataKey="lastYearCount"
            name="lastYearCount"
            fill={getAtlasChartColor(0)}
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          >
            <LabelList
              dataKey="lastYearCount"
              position="top"
              fill={CHART_LABEL_COLOR}
              fontSize={10}
              fontWeight={500}
              formatter={(value: number) =>
                value > 0 ? value.toLocaleString() : ""
              }
            />
          </Bar>
          <Line
            yAxisId="change"
            type="monotone"
            dataKey="percentIncrease"
            name="percentIncrease"
            stroke={getAtlasChartColor(3)}
            strokeWidth={2.5}
            dot={{
              fill: getAtlasChartColor(3),
              strokeWidth: 0,
              r: 4,
            }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
