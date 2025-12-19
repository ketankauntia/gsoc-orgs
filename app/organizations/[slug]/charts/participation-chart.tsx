"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ParticipationChartProps {
  data: Array<{ year: string; participated: number }>;
  projectsData: Array<{ year: string; projects: number }>;
}

export function ParticipationChart({ data, projectsData }: ParticipationChartProps) {
  // Merge participation and projects data
  const mergedData = data.map((d) => {
    const projectEntry = projectsData.find((p) => p.year === d.year);
    return {
      year: d.year,
      participated: d.participated,
      projects: projectEntry?.projects || 0,
    };
  });

  // Add years from projectsData that might not be in participation data
  projectsData.forEach((p) => {
    if (!mergedData.find((d) => d.year === p.year)) {
      mergedData.push({
        year: p.year,
        participated: 0,
        projects: p.projects,
      });
    }
  });

  // Sort by year
  mergedData.sort((a, b) => parseInt(a.year) - parseInt(b.year));

  // Take last 10 years
  const chartData = mergedData.slice(-10);

  if (chartData.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
        No participation data available
      </div>
    );
  }

  const maxProjects = Math.max(...chartData.map((d) => d.projects), 1);

  return (
    <div className="h-[180px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={40}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxProjects + 2]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [
              value,
              name === "projects" ? "Projects" : "Participated",
            ]}
          />
          <Bar
            dataKey="projects"
            fill="#7dd3fc"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
          <Bar
            dataKey="participated"
            fill="#0ea5e9"
            radius={[4, 4, 0, 0]}
            maxBarSize={30}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

