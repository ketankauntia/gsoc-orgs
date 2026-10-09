import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { AboutView } from "@/components/cobalt/views/community";

/** Mostly static content: cache for 30 days. */
export const revalidate = 2592000; // 30 days

export const metadata: Metadata = buildPageMetadata({
  title: "About Us",
  description:
    "Learn about the mission behind GSoC Organizations Guide: helping students discover, compare, and prepare for Google Summer of Code organizations.",
  path: "/about",
  keywords: [
    "about GSoC",
    "Google Summer of Code guide",
    "GSoC platform",
    "open source education",
    "student developer resources",
  ],
});

export default function AboutPage() {
  return <AboutView />;
}
