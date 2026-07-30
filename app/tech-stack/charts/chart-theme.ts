import type { CSSProperties } from "react";

export const ATLAS_CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

export const CHART_AXIS_COLOR = "var(--muted-foreground)";
export const CHART_GRID_COLOR = "var(--border)";
export const CHART_LABEL_COLOR = "var(--foreground)";

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  color: "var(--card-foreground)",
  fontSize: "12px",
};

export function getAtlasChartColor(index: number) {
  return ATLAS_CHART_COLORS[index % ATLAS_CHART_COLORS.length];
}
