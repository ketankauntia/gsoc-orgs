import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewThemesClient } from "@/components/dashboard/preview-themes-client";
import { getAllPosts } from "@/lib/blog/content";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Theme Preview - GSoC Organizations Blog",
  robots: { index: false, follow: false },
};

export default function ThemePreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const posts = getAllPosts().map((p) => ({ slug: p.slug, title: p.title }));
  return (
    <PreviewThemesClient
      initial={getSettings()}
      posts={posts}
      canSave={process.env.NODE_ENV === "development"}
    />
  );
}
