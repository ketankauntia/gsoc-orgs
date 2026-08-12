import type { Metadata } from "next";
import { ModerationDetail } from "@/components/admin/moderation-detail";
export const metadata: Metadata = { title: "Review proposal", robots: { index: false, follow: false } };
export default async function AdminProposalPage({ params }: { params: Promise<{ id: string }> }) { return <main className="mx-auto max-w-7xl px-6 pb-20 lg:px-12"><ModerationDetail id={(await params).id} /></main>; }
