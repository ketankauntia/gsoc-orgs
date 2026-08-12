import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { requireModerator } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { roles } = await requireModerator();
  return <><Header /><div className="min-h-screen pt-28"><nav className="mx-auto mb-8 flex max-w-6xl gap-2 px-6 lg:px-12"><Button asChild variant="outline" size="sm"><Link href="/admin/proposals">Proposal queue</Link></Button>{roles.includes("admin") ? <Button asChild variant="outline" size="sm"><Link href="/admin/roles">Roles</Link></Button> : null}<Button asChild variant="ghost" size="sm"><Link href="/account">Contributor account</Link></Button></nav>{children}</div><Footer /></>;
}
