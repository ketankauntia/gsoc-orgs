import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { loadPostRows } from "@/lib/blog/dashboard";

export const metadata: Metadata = {
  title: "Dashboard - GSoC Organizations Blog",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DashboardClient rows={loadPostRows()} />;
}
