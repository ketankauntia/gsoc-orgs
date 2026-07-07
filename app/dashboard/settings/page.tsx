import type { Metadata } from "next";
import { SettingsClient } from "@/components/dashboard/settings-client";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Settings — GSoC Organizations Blog",
  robots: { index: false, follow: false },
};

/** Dashboard settings — pick the blog + post templates. Saves are dev-only (writes content/settings.json). */
export default function SettingsPage() {
  return (
    <SettingsClient
      initial={getSettings()}
      canSave={process.env.NODE_ENV === "development"}
    />
  );
}
