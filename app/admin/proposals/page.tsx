import type { Metadata } from "next";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export const metadata: Metadata = { title: "Proposal moderation", robots: { index: false, follow: false } };
export default function AdminProposalsPage() { return <main className="mx-auto max-w-6xl px-6 pb-20 lg:px-12"><h1 className="text-4xl font-semibold tracking-tight">Proposal moderation</h1><p className="mt-3 text-muted-foreground">Verify identity claims separately from reviewing the submitted document. Every action is audited.</p><div className="mt-9"><ModerationQueue /></div></main>; }
