import type { Metadata } from "next";
import { loadPostRows } from "@/lib/blog/dashboard";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard — GSoC Organizations Blog",
  robots: { index: false, follow: false },
};

/** Content dashboard: every post with the metrics a writer / owner / SEO cares about. Dev/internal tool. */
export default function DashboardPage() {
  return <DashboardClient rows={loadPostRows()} />;
}
