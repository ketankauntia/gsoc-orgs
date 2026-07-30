import Link from "next/link";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import {
  Button,
  Heading,
  MetricCell,
  PageRail,
  SourceNote,
  Text,
} from "@/components/ui";
import type { Metadata } from "next";
import { getFullUrl } from "@/lib/constants";
import { ArrowUpRight, Code, Globe, Heart, Target } from "lucide-react";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";
import { SOCIAL_LINKS } from "@/components/footer-common";
import { loadHomepageData } from "@/lib/homepage-types";

// Force revalidation to ensure footer links stay updated
/**
 * ISR Configuration for Static Pages
 *
 * About page is mostly static content - cache for 30 days.
 * Only needs revalidation when content changes.
 */
export const revalidate = 2592000; // 30 days

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how the independent GSoC Atlas organizes public Google Summer of Code history for organization and project research.",
  keywords: [
    "about GSoC",
    "Google Summer of Code guide",
    "GSoC platform",
    "open source education",
    "student developer resources",
  ],
  openGraph: {
    title: "About GSoC Atlas",
    description:
      "Learn about our mission to help students discover and prepare for Google Summer of Code opportunities.",
    url: getFullUrl("/about"),
    type: "website",
    siteName: "GSoC Atlas",
    images: [
      {
        url: getFullUrl("/og/gsoc-organizations-guide.jpg"),
        width: 1200,
        height: 630,
        alt: "GSoC Atlas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About GSoC Atlas",
    description:
      "Learn about our mission to help students discover and prepare for Google Summer of Code opportunities.",
    images: [getFullUrl("/og/gsoc-organizations-guide.jpg")],
  },
  alternates: {
    canonical: getFullUrl("/about"),
  },
};

const values = [
  {
    icon: Target,
    title: "Evidence first",
    description:
      "Every count comes from a dated archive snapshot, and every page should make missing or partial data visible.",
  },
  {
    icon: Heart,
    title: "Research, not ranking",
    description:
      "The atlas supports better questions and stronger shortlists without inventing selection odds or community-fit scores.",
  },
  {
    icon: Code,
    title: "Connected records",
    description:
      "Organizations, projects, technologies, topics, and years link together so a useful discovery never becomes a dead end.",
  },
  {
    icon: Globe,
    title: "Independent and open",
    description:
      "GSoC Atlas is not affiliated with Google. Its source and feedback channels stay open to the community.",
  },
];

export default async function AboutPage() {
  const homepageData = await loadHomepageData();
  const snapshotDate = homepageData
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(homepageData.published_at))
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-20 pt-28">
        <PageRail as="div">
          <SiteBreadcrumbs items={[{ label: "About", href: "/about" }]} />

          <section className="atlas-corner-marks relative mt-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink px-6 py-14 text-[#f5eee9] sm:px-8 sm:py-18 lg:px-12 lg:py-24">
            <div
              aria-hidden="true"
              className="atlas-grid absolute inset-0 text-white opacity-20 [mask-image:linear-gradient(to_bottom_right,black,transparent_72%)]"
            />
            <div className="relative max-w-4xl">
              <p className="flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.2em] text-[#aaa29d]">
                <span aria-hidden="true" className="size-2 bg-primary" />
                Independent GSoC research guide
              </p>
              <Heading
                as="h1"
                variant="section"
                className="mt-5 max-w-4xl text-[#f5eee9]"
              >
                Making the GSoC archive easier to investigate.
              </Heading>
              <Text
                variant="lead"
                className="mt-7 max-w-2xl text-[#c8c0bb]"
              >
                GSoC Atlas organizes public program history into practical
                paths for exploring organizations, projects, technologies, and
                topics before you decide where to contribute.
              </Text>
            </div>
          </section>

          {homepageData && snapshotDate ? (
            <section aria-labelledby="dataset-heading" className="py-16">
              <div className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
                <div>
                  <p className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    What the atlas contains
                  </p>
                  <div id="dataset-heading">
                    <Heading
                      variant="subsection"
                      className="mt-3 max-w-2xl"
                    >
                      A navigable record, not a promise of selection.
                    </Heading>
                  </div>
                </div>
                <SourceNote date={snapshotDate} />
              </div>
              <div className="grid border-b border-border sm:grid-cols-3">
                <MetricCell
                  value={homepageData.metrics.total_organizations.toLocaleString()}
                  label="Recorded organizations"
                  note="Across available program years"
                  className="border-b sm:border-b-0 sm:border-r"
                />
                <MetricCell
                  value={homepageData.metrics.active_organizations.toLocaleString()}
                  label="Active snapshot organizations"
                  note="Latest generated dataset"
                  className="border-b sm:border-b-0 sm:border-r"
                />
                <MetricCell
                  value={homepageData.metrics.total_projects.toLocaleString()}
                  label="Recorded projects"
                  note="Public archive entries"
                />
              </div>
            </section>
          ) : null}

          <section className="grid gap-10 border-t border-border py-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:py-20">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                How we work
              </p>
              <Heading variant="subsection" className="mt-3">
                Four principles behind the guide.
              </Heading>
              <Text className="mt-5 max-w-md text-muted-foreground">
                The product is designed to reduce research friction while
                keeping the evidence, limits, and next action visible.
              </Text>
            </div>

            <div className="grid overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-2">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <article
                    key={value.title}
                    className={[
                      "min-h-64 p-6 sm:p-8",
                      index < 3 ? "border-b border-border" : "",
                      index === 2 ? "sm:border-b-0" : "",
                      index % 2 === 0 ? "sm:border-r sm:border-border" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-8 text-xl font-semibold tracking-[-0.025em]">
                      {value.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {value.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="grid gap-10 border-t border-border py-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16 lg:py-20">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Why it exists
              </p>
              <Heading variant="subsection" className="mt-3">
                Research should lead to contribution.
              </Heading>
            </div>
            <div className="max-w-2xl space-y-5 text-base leading-7 text-foreground/82">
              <p>
                Google Summer of Code gives contributors a path into real
                open-source work, but the archive can be difficult to read when
                hundreds of organizations, technologies, and project histories
                compete for attention.
              </p>
              <p>
                GSoC Atlas brings that public information into one research
                surface. It helps people compare recorded participation, inspect
                project history, and move from browsing toward informed
                contribution.
              </p>
              <p>
                The guide does not predict selection. It makes the available
                evidence easier to inspect and leaves the important work —
                learning the codebase, talking to communities, and contributing
                consistently — with the applicant.
              </p>
            </div>
          </section>

          <section className="atlas-corner-marks rounded-[1.5rem] border border-border bg-cream px-6 py-12 sm:px-8 lg:flex lg:items-end lg:justify-between lg:gap-12 lg:px-12 lg:py-16">
            <div className="max-w-2xl">
              <p className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Open-source project
              </p>
              <Heading variant="subsection" className="mt-3">
                Built by the community, for the community.
              </Heading>
              <Text className="mt-5 text-muted-foreground">
                Explore the dataset, report gaps, or help make the research
                experience clearer for the next contributor.
              </Text>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:mt-0">
              <Button asChild>
                <Link href="/organizations">
                  Explore the atlas
                  <ArrowUpRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={SOCIAL_LINKS.github.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contribute on GitHub
                </a>
              </Button>
            </div>
          </section>
        </PageRail>
      </main>
      <FooterSmall />
    </div>
  );
}
