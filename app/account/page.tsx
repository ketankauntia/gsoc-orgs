import type { Metadata } from "next";
import { AccountWorkspace } from "@/components/hub/account";
import { requireViewer } from "@/lib/auth";
import { getMyParticipations } from "@/lib/hub/queries";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const viewer = await requireViewer("/account");
  const participations = await getMyParticipations(viewer.user.id);
  return <AccountWorkspace profile={viewer.profile} image={viewer.user.image} isAdmin={viewer.isAdmin} participations={participations} />;
}
