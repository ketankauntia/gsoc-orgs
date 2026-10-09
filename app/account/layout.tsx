import { AccountFrame } from "@/components/cobalt/views/community";
import { requireViewer } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireViewer("/account");
  return <AccountFrame>{children}</AccountFrame>;
}
