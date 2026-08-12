import type { Metadata } from "next";
import Link from "next/link";
import { AccountDashboard } from "@/components/account/account-dashboard";
import { Button } from "@/components/ui/button";
import { getUserRoles, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Contributor account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const user = await requireUser();
  const roles = await getUserRoles(user.id);
  return <main className="mx-auto max-w-5xl px-6 pb-20 lg:px-12"><div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm font-medium text-primary">Signed in</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Your contributor workspace</h1><p className="mt-3 text-muted-foreground">Manage private submissions and choose exactly what becomes public after approval.</p></div><div className="flex gap-2">{roles.some((role) => role === "moderator" || role === "admin") ? <Button asChild variant="outline"><Link href="/admin/proposals">Moderation</Link></Button> : null}<form action="/auth/signout" method="post"><Button variant="ghost">Sign out</Button></form></div></div><AccountDashboard /></main>;
}
