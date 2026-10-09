import type { Metadata } from "next";
import { redirect, unstable_rethrow } from "next/navigation";
import { ClaimPicker } from "@/components/hub/claim-picker";
import { getSessionUser, getViewer } from "@/lib/auth";
import { getClaimPrefill, getClaimYears } from "@/lib/hub/queries";

export const metadata: Metadata = { title: "Claim a project", robots: { index: false, follow: false } };

export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ project?: string | string[] }> }) {
  const params = await searchParams;
  const project = typeof params.project === "string" ? params.project : undefined;
  // A suspended account, or one whose profile cannot be loaded, goes to /account, which explains it and offers sign-out.
  const viewer = await getViewer().catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  if (!viewer || viewer.profile.status !== "active") {
    const next = `/account/claim${project ? `?project=${encodeURIComponent(project)}` : ""}`;
    redirect((await getSessionUser()) ? "/account" : `/login?next=${encodeURIComponent(next)}`);
  }
  const externalId = project && project.length <= 200 ? project : null;
  const [years, prefill] = await Promise.all([getClaimYears(), externalId ? getClaimPrefill(externalId) : null]);
  return (
    <main>
      <header className="cb-hub-head">
        <div>
          <p className="cb-eyebrow">CLAIM A PROJECT</p>
          <h1>Which GSoC project was yours?</h1>
          <p>Find the project in Google&apos;s archive and pick your name: the contributor, or one of the mentors. We verify every claim before your proposal can be published.</p>
        </div>
      </header>
      <ClaimPicker years={years} prefill={prefill} />
    </main>
  );
}
