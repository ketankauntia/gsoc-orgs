import { redirect } from "next/navigation";
import { AccountFrame } from "@/components/cobalt/views/community";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Each page checks its own viewer. The layout only needs a session, so a
// suspended account still reaches /account, where it can sign out.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await getSessionUser())) redirect("/login?next=%2Faccount");
  return <AccountFrame>{children}</AccountFrame>;
}
