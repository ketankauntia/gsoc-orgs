import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { ProfileForm } from "@/components/hub/profile-form";
import { getSessionUser, getViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  // A suspended account, or one whose profile cannot be loaded, goes to /account, which explains it and offers sign-out.
  const viewer = await getViewer().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  if (!viewer || viewer.profile.status !== "active") redirect((await getSessionUser()) ? "/account" : "/login?next=%2Faccount%2Fprofile");
  return (
    <main>
      <header className="cb-hub-head">
        <div>
          <p className="cb-eyebrow">YOUR ACCOUNT</p>
          <h1>Profile</h1>
          <p>Your name and links appear next to your verified projects, proposals and posts. Make the profile public to get a page of your own.</p>
        </div>
      </header>
      <ProfileForm profile={viewer.profile} />
    </main>
  );
}
