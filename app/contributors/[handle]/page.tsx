import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconBrandGithub, IconBrandMedium, IconBrandX, IconWorld } from "@tabler/icons-react";
import { PageHead } from "@/components/cobalt/page";
import { getPublicProfile } from "@/lib/hub/public";
import "@/components/cobalt/community.css";
import "@/components/hub/hub.css";

export const revalidate = 600;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getPublicProfile((await params).handle);
  if (!profile) return { title: "Profile not found", robots: { index: false } };
  const roles = profile.history.map((item) => `${item.role === "mentor" ? "mentor" : "contributor"} ${item.year}`).join(", ");
  return {
    title: `${profile.display_name} · GSoC ${roles ? `(${roles})` : "profile"}`,
    description: profile.bio ?? `${profile.display_name}'s verified Google Summer of Code projects.`,
    alternates: { canonical: `/contributors/${profile.handle}` },
  };
}

export default async function ContributorProfilePage({ params }: Props) {
  const profile = await getPublicProfile((await params).handle);
  if (!profile) notFound();
  const links = [
    profile.website_url ? { href: profile.website_url, label: "Website", icon: <IconWorld size={14} stroke={1.9} aria-hidden /> } : null,
    profile.github_username ? { href: `https://github.com/${profile.github_username}`, label: profile.github_username, icon: <IconBrandGithub size={14} stroke={1.9} aria-hidden /> } : null,
    profile.x_username ? { href: `https://x.com/${profile.x_username}`, label: `@${profile.x_username}`, icon: <IconBrandX size={14} stroke={1.9} aria-hidden /> } : null,
    profile.medium_url ? { href: profile.medium_url, label: "Medium", icon: <IconBrandMedium size={14} stroke={1.9} aria-hidden /> } : null,
  ].filter((link): link is { href: string; label: string; icon: React.ReactElement } => Boolean(link));

  return (
    <main>
      <PageHead
        crumbs={[{ label: "Home", href: "/" }, { label: "Contributors" }, { label: profile.display_name }]}
        eyebrow="GSOC PROFILE"
        title={profile.display_name}
        lede={profile.bio ?? undefined}
      >
        {links.length ? <div className="cb-hub-links">{links.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer me" className="cb-pill">{link.icon}{link.label}</a>)}</div> : null}
      </PageHead>
      <div className="cb-page cb-page-body">
        <section aria-labelledby="cb-profile-history" className="cb-hub-stack" style={{ maxWidth: 820 }}>
          <h2 id="cb-profile-history" className="cb-hub-subtitle">Verified GSoC projects</h2>
          {profile.history.length ? profile.history.map((item) => (
            <article key={item.person_id} className="cb-card cb-hub-claim">
              <div className="cb-hub-claim-head">
                <div style={{ minWidth: 0 }}>
                  <div className="cb-hub-meta">
                    <span className="cb-badge" data-tone="accent">{item.role === "contributor" ? "Contributor" : "Mentor"}</span>
                    <span className="cb-badge">{item.year}</span>
                    <Link className="cb-inline-link" href={`/organizations/${item.organization_slug}`} style={{ fontSize: 13.5 }}>{item.organization_name}</Link>
                  </div>
                  <h3>{item.project_title}</h3>
                </div>
                <span className="cb-pill" data-tone="ok"><span className="cb-dot" />Verified</span>
              </div>
              {item.story ? (
                <div className="cb-hub-section">
                  <dl className="cb-hub-compare">
                    {item.story.chose_org_because ? <div style={{ gridColumn: "1 / -1" }}><dt>Why this organization</dt><dd>{item.story.chose_org_because}</dd></div> : null}
                    {item.story.prior_contributions !== undefined ? <div><dt>Contributions before applying</dt><dd>{item.story.prior_contributions}</dd></div> : null}
                    {item.story.hours_per_week !== undefined ? <div><dt>Hours per week</dt><dd>{item.story.hours_per_week}</dd></div> : null}
                    {item.story.proposal_tip ? <div style={{ gridColumn: "1 / -1" }}><dt>What made the proposal work</dt><dd>{item.story.proposal_tip}</dd></div> : null}
                    {item.story.advice ? <div style={{ gridColumn: "1 / -1" }}><dt>Advice for applicants</dt><dd>{item.story.advice}</dd></div> : null}
                  </dl>
                </div>
              ) : null}
            </article>
          )) : <p className="cb-hub-hint">No verified projects yet.</p>}
        </section>
      </div>
    </main>
  );
}
