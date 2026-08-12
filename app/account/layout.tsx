import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <><Header /><div className="min-h-screen pt-28">{children}</div><Footer /></>;
}
