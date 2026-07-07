import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SettingsClient } from "@/components/dashboard/settings-client";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Settings - GSoC Organizations Blog",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <SettingsClient
      initial={getSettings()}
      canSave={process.env.NODE_ENV === "development"}
    />
  );
}
