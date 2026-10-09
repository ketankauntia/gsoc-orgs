import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { ChangelogView } from "@/components/cobalt/views/community";
import { CHANGELOG_ENTRIES } from "@/lib/changelog-data";

export const metadata: Metadata = buildPageMetadata({
  title: "Changelog",
  description:
    "Track every release of GSoC Organizations Guide: new features, data refreshes, improvements, and fixes, listed newest first with the date of each change.",
  path: "/changelog",
});

export default function ChangelogPage() {
  return <ChangelogView entries={CHANGELOG_ENTRIES} />;
}
