import type { Metadata } from "next";
import { AdminProposals } from "@/components/hub/admin";
import { requireAdmin } from "@/lib/auth";
import { getAdminProposals } from "@/lib/hub/admin";

export const metadata: Metadata = { title: "Proposals", robots: { index: false, follow: false } };

export default async function AdminProposalsPage() {
  await requireAdmin("/admin/proposals");
  const proposals = await getAdminProposals();
  return (
    <main>
      <header className="cb-hub-head">
        <div>
          <p className="cb-eyebrow">ADMIN</p>
          <h1>Proposals</h1>
          <p>Removal requests and drafts come first. Each proposal has one file; replacing it overwrites the old one.</p>
        </div>
      </header>
      <AdminProposals proposals={proposals} />
    </main>
  );
}
