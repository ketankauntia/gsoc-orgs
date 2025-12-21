"use client";

import { TrendingUp, Award } from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, LabelList } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartTooltip,
} from "@/components/ui/chart";

// Chart 1: Top Programming Languages Bar Chart
interface LanguageData {
  language: string;
  count: number;
  percentage: number;
}

export function LanguagesBarChart({ data }: { data: LanguageData[] }) {
  // Take top 10 for readability
  const topLanguages = data.slice(0, 10);
  const maxCount = Math.max(...topLanguages.map((d) => d.count), 1);

  // Teal gradient colors
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
    <Card>
      <CardHeader>
        <CardTitle>Top Programming Languages</CardTitle>
        <CardDescription>
          Most commonly used languages across organizations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topLanguages}
              layout="vertical"
              margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                domain={[0, maxCount]}
              />
              <YAxis
                dataKey="language"
                type="category"
                tick={{ fontSize: 12, fill: "#374151", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [value.toLocaleString(), "Organizations"]}
              />
              <Bar 
                dataKey="count" 
                radius={[0, 4, 4, 0]} 
                maxBarSize={28}
              >
                {topLanguages.map((_, index) => (
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
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Python dominates with {data[0]?.percentage}% adoption <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Showing top {topLanguages.length} programming languages
        </div>
      </CardFooter>
    </Card>
  );
}

// Chart 2: Organizations by Student Slots (Horizontal Bar Chart)
interface StudentSlotData {
  org: string;
  slots: number;
}

export function StudentSlotsBarChart({ 
  data, 
  year 
}: { 
  data: StudentSlotData[]; 
  year: string;
}) {
  // Take top 8 for readability
  const topOrgs = data.slice(0, 8);
  const maxCount = Math.max(...topOrgs.map((d) => d.slots), 1);

  // Teal gradient colors
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
    <Card>
      <CardHeader>
        <CardTitle>Most Student Slots</CardTitle>
        <CardDescription>
          Organizations offering the most opportunities in {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topOrgs}
              layout="vertical"
              margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                domain={[0, maxCount]}
              />
              <YAxis
                dataKey="org"
                type="category"
                tick={{ fontSize: 11, fill: "#374151", fontWeight: 500 }}
                tickLine={false}
                axisLine={false}
                width={120}
              />
              <ChartTooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [value.toLocaleString(), "Slots"]}
              />
              <Bar 
                dataKey="slots" 
                radius={[0, 4, 4, 0]} 
                maxBarSize={28}
              >
                {topOrgs.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
                <LabelList
                  dataKey="slots"
                  position="right"
                  fill="#374151"
                  fontSize={11}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          {topOrgs[0]?.org} leads with {topOrgs[0]?.slots} slots <Award className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Higher slots = more opportunities for contributors
        </div>
      </CardFooter>
    </Card>
  );
}

// Chart 3: Organizations with Most Projects (Vertical Bar Chart)
interface OrgProjectData {
  name: string;
  projects: number;
}

export function OrganizationsProjectsChart({ 
  data 
}: { 
  data: OrgProjectData[]; 
}) {
  // Take top 8-10 organizations
  const topOrgs = data.slice(0, 10);
  const maxCount = Math.max(...topOrgs.map((d) => d.projects), 1);

  // Teal gradient colors
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
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={topOrgs}
          margin={{ top: 20, right: 5, left: -25, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            domain={[0, maxCount + 5]}
          />
          <ChartTooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number) => [value.toLocaleString(), "Projects"]}
          />
          <Bar dataKey="projects" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {topOrgs.map((_, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(index)} />
            ))}
            <LabelList
              dataKey="projects"
              position="top"
              fill="#374151"
              fontSize={11}
              fontWeight={600}
              formatter={(value: number) => value > 0 ? value : ''}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

