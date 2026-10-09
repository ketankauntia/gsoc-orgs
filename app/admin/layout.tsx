import { AdminFrame } from "@/components/cobalt/views/community";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <AdminFrame>{children}</AdminFrame>;
}
