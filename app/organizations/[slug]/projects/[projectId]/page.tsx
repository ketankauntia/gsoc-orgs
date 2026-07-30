import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Code2,
  UserRound,
  UsersRound,
} from "lucide-react";

import { FooterSmall } from "@/components/footer-small";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";
import {
  Badge,
  Button,
  CardWrapper,
  MetricCell,
  PageRail,
  SourceNote,
} from "@/components/ui";
import {
  getAvailableProjectYears,
  loadProjectsYearData,
  type ProjectEntry,
} from "@/lib/projects-page-types";
import { technologyToSlug } from "@/lib/taxonomy-slugs";

interface ProjectRecord extends ProjectEntry {
  archivePublishedAt: string;
}

async function getProject(
  orgSlug: string,
  projectId: string,
): Promise<ProjectRecord | null> {
  const years = getAvailableProjectYears().toSorted((a, b) => b - a);
  const yearDocuments = await Promise.all(years.map(loadProjectsYearData));

  for (const document of yearDocuments) {
    const project = document?.projects.find(
      (entry) =>
        entry.project_id === projectId && entry.org_slug === orgSlug,
    );

    if (project && document) {
      return {
        ...project,
        archivePublishedAt: document.published_at,
      };
    }
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}): Promise<Metadata> {
  const { slug, projectId } = await params;
  const project = await getProject(slug, projectId);

  if (!project) {
    return {
      title: "Project not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${project.project_title} | ${project.org_name}`,
    description:
      project.project_abstract_short ??
      `An archived Google Summer of Code ${project.year} project from ${project.org_name}.`,
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;
  const project = await getProject(slug, projectId);

  if (!project) {
    notFound();
  }

  const snapshotDate = project.archivePublishedAt
    ? new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }).format(new Date(project.archivePublishedAt))
    : `${project.year} archive`;

  return (
    <>
      <PageRail
        className="bg-ink text-[#f5eee9]"
        innerClassName="border-white/10 py-6 sm:py-8"
      >
        <SiteBreadcrumbs
          className="[&_a]:text-[#aaa29d] [&_span]:text-[#f5eee9] [&_svg]:text-white/30"
          items={[
            { label: "Organizations", href: "/organizations" },
            { label: project.org_name, href: `/organizations/${slug}` },
            { label: project.project_title },
          ]}
        />
      </PageRail>

      <PageRail
        className="bg-ink text-[#f5eee9]"
        innerClassName="border-white/10 pb-14 pt-8 sm:pb-20 sm:pt-12"
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
          <div className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge className="border-white/15 bg-white/10 text-[#f5eee9]">
                Archive record
              </Badge>
              <span className="font-data text-xs text-[#aaa29d]">
                GSoC {project.year}
              </span>
            </div>
            <h1 className="max-w-4xl text-balance text-[clamp(2.75rem,7vw,6.5rem)] font-medium leading-[0.92] tracking-[-0.065em]">
              {project.project_title}
            </h1>
            <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-[#c8c0ba] sm:text-lg">
              {project.project_abstract_short ??
                "This archive record does not include a project abstract."}
            </p>
          </div>

          <div className="space-y-4 border-t border-white/15 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="font-data text-[11px] uppercase tracking-[0.16em] text-[#aaa29d]">
              Organization
            </p>
            <Link
              className="group inline-flex items-center gap-2 text-lg font-semibold text-[#f5eee9] hover:text-brand"
              href={`/organizations/${project.org_slug}`}
            >
              {project.org_name}
              <ArrowUpRight
                aria-hidden="true"
                className="size-4 transition-transform duration-[180ms] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
              />
            </Link>
            <SourceNote
              inverse
              date={snapshotDate}
              source={`GSoC ${project.year} public archive`}
            />
          </div>
        </div>
      </PageRail>

      <PageRail innerClassName="py-10 sm:py-14">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-8">
          <Link href={`/organizations/${project.org_slug}`}>
            <ArrowLeft aria-hidden="true" />
            Back to organization
          </Link>
        </Button>

        <div className="grid overflow-hidden rounded-2xl border bg-card sm:grid-cols-2 lg:grid-cols-4">
          <MetricCell
            className="border-b sm:border-r lg:border-b-0"
            value={project.year}
            label="Program year"
            note="Archived participation"
          />
          <MetricCell
            className="border-b lg:border-b-0 lg:border-r"
            value={project.mentors.length}
            label={project.mentors.length === 1 ? "Mentor" : "Mentors"}
            note="Names present in the archive"
          />
          <MetricCell
            className="border-b sm:border-b-0 sm:border-r"
            value={project.tech_stack?.length ?? 0}
            label="Recorded technologies"
            note="May be incomplete"
          />
          <MetricCell
            value={project.project_code_url ? "Yes" : "—"}
            label="Code link"
            note="As supplied by the archive"
          />
        </div>
      </PageRail>

      <PageRail
        className="deferred-section"
        innerClassName="grid gap-8 pb-20 lg:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <div className="space-y-8">
          <CardWrapper padding="lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserRound aria-hidden="true" className="size-4" />
              <span className="font-data text-[11px] uppercase tracking-[0.14em]">
                Contributor
              </span>
            </div>
            <p className="mt-5 text-2xl font-semibold tracking-tight">
              {project.contributor || "Not recorded"}
            </p>
          </CardWrapper>

          <CardWrapper padding="lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UsersRound aria-hidden="true" className="size-4" />
              <h2 className="font-data text-[11px] uppercase tracking-[0.14em]">
                Recorded mentors
              </h2>
            </div>
            {project.mentors.length ? (
              <ul className="mt-5 divide-y">
                {project.mentors.map((mentor) => (
                  <li className="py-3 text-base font-medium" key={mentor}>
                    {mentor}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                No mentor names are present in this archive record.
              </p>
            )}
          </CardWrapper>
        </div>

        <aside className="space-y-6">
          <CardWrapper padding="lg">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Code2 aria-hidden="true" className="size-4" />
              <h2 className="font-data text-[11px] uppercase tracking-[0.14em]">
                Technology record
              </h2>
            </div>
            {project.tech_stack?.length ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tech_stack.map((technology) => (
                  <Link
                    href={`/tech-stack/${technologyToSlug(technology)}`}
                    key={technology}
                  >
                    <Badge variant="outline">{technology}</Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                The source record did not include technology tags.
              </p>
            )}
          </CardWrapper>

          <CardWrapper className="bg-accent" padding="lg">
            <div className="flex items-center gap-2 text-accent-foreground">
              <CalendarDays aria-hidden="true" className="size-4" />
              <h2 className="font-data text-[11px] uppercase tracking-[0.14em]">
                Historical context
              </h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-accent-foreground/80">
              This is a completed-project archive, not a current application
              listing. Dates, eligibility, and project ideas change each year.
            </p>
            {project.project_code_url ? (
              <Button asChild className="mt-6 w-full">
                <a
                  href={project.project_code_url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open recorded code
                  <ArrowUpRight aria-hidden="true" />
                </a>
              </Button>
            ) : null}
          </CardWrapper>
        </aside>
      </PageRail>

      <FooterSmall />
    </>
  );
}
