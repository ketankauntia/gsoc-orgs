import { AccountFrame } from "@/components/cobalt/views/community";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <AccountFrame>{children}</AccountFrame>;
}
