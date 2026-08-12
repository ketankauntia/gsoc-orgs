import type { Metadata } from "next";
import { RoleManager } from "@/components/admin/role-manager";
import { requireAdmin } from "@/lib/auth";
export const metadata: Metadata = { title: "Admin roles", robots: { index: false, follow: false } };
export default async function RolesPage() { await requireAdmin(); return <main className="mx-auto max-w-6xl px-6 pb-20 lg:px-12"><h1 className="text-4xl font-semibold tracking-tight">Roles and access</h1><p className="mt-3 text-muted-foreground">Grant named Google accounts auditable moderation access.</p><div className="mt-8"><RoleManager /></div></main>; }
