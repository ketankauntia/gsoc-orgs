import type { Metadata } from "next";
import { Suspense } from "react";
import { PreviewClient } from "@/components/editor/preview-client";

export const metadata: Metadata = {
  title: "Preview — GSoC Organizations Editor",
  robots: { index: false, follow: false },
};

/** Full-page preview of the current editor draft (read from localStorage). Dev-only tool. */
export default function EditorPreviewPage() {
  return (
    <Suspense fallback={null}>
      <PreviewClient />
    </Suspense>
  );
}
