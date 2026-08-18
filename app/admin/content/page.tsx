import type { Metadata } from "next";
import { ContentImportManager } from "@/components/admin/content-import-manager";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin content imports", robots: { index: false, follow: false } };

export default async function AdminContentPage() {
  await requireAdmin();
  return <main className="mx-auto max-w-6xl px-6 pb-20 lg:px-12"><h1 className="text-4xl font-semibold tracking-tight">Curated contributor content</h1><p className="mt-3 max-w-3xl text-muted-foreground">Import contributor-authorized accepted proposals and publish selected students’ project blogs. These controls and their APIs require the administrator role.</p><div className="mt-9"><ContentImportManager /></div></main>;
}
