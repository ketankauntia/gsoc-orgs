import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { AccountUnavailable, AccountWorkspace } from "@/components/hub/account";
import { getSessionUser, getViewer } from "@/lib/auth";
import { getMyParticipations } from "@/lib/hub/queries";

export const metadata: Metadata = { title: "Your account", robots: { index: false, follow: false } };

export default async function AccountPage() {
  // Suspended accounts, and sessions whose profile cannot be loaded, get a page with sign-out instead of a redirect loop.
  const viewer = await getViewer().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  if (!viewer || viewer.profile.status !== "active") {
    if (!(await getSessionUser())) redirect("/login?next=%2Faccount");
    return <AccountUnavailable suspended={viewer?.profile.status === "suspended"} />;
  }
  const participations = await getMyParticipations(viewer.user.id);
  return <AccountWorkspace profile={viewer.profile} image={viewer.user.image} isAdmin={viewer.isAdmin} participations={participations} />;
}
