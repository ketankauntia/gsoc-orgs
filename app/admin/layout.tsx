import { AdminFrame } from "@/components/cobalt/views/community";
import { requireModerator } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { roles } = await requireModerator();
  return <AdminFrame isAdmin={roles.includes("admin")}>{children}</AdminFrame>;
}
