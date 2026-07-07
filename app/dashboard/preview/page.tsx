import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog/content";
import { getSettings } from "@/lib/settings";
import { PreviewThemesClient } from "@/components/dashboard/preview-themes-client";

export const metadata: Metadata = {
  title: "Theme Preview — GSoC Organizations Blog",
  robots: { index: false, follow: false },
};

/** Live theme preview: pick templates in the toolbar, see the real site update in the frame below, browse any route, then keep or revert. */
export default function ThemePreviewPage() {
  const posts = getAllPosts().map((p) => ({ slug: p.slug, title: p.title }));
  return (
    <PreviewThemesClient
      initial={getSettings()}
      posts={posts}
      canSave={process.env.NODE_ENV === "development"}
    />
  );
}
