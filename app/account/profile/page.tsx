import type { Metadata } from "next";
import { ProfileForm } from "@/components/hub/profile-form";
import { requireViewer } from "@/lib/auth";

export const metadata: Metadata = { title: "Edit profile", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const viewer = await requireViewer("/account/profile");
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
