import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PreviewClient } from "@/components/editor/preview-client";

export const metadata: Metadata = {
  title: "Preview - GSoC Organizations Editor",
  robots: { index: false, follow: false },
};

export default function EditorPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <PreviewClient />
    </Suspense>
  );
}
