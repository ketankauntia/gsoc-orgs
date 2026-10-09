import type { Metadata } from "next";
import { AdminClaims } from "@/components/hub/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminQueue } from "@/lib/hub/admin";

export const metadata: Metadata = { title: "Claims to review", robots: { index: false, follow: false } };

export default async function AdminClaimsPage() {
  await requireAdmin();
  const { claims, recent } = await getAdminQueue();
  return (
    <main>
      <header className="cb-hub-head">
        <div>
          <p className="cb-eyebrow">ADMIN</p>
          <h1>Claims to review</h1>
          <p>Compare each claimant with Google&apos;s archive. Verifying unlocks proposal uploads for contributors and marks their posts verified.</p>
        </div>
      </header>
      <AdminClaims claims={claims} recent={recent.map((entry) => ({ ...entry, at: new Date(entry.at).toISOString() }))} />
    </main>
  );
}
