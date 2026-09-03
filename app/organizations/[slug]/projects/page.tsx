import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { Badge, Button, CardWrapper, Container, Heading, Text } from "@/components/ui";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import {
  canonicalOrganizationSlug,
  loadOrganizationData,
} from "@/lib/organizations-page-types";
import {
  groupProjectsByYear,
  loadOrganizationProjects,
} from "@/lib/projects-page-types";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";

/**
 * Per-organization project index.
 *
 * Route: /organizations/[slug]/projects
 *
 * This page exists primarily as a crawlable hub. Project detail pages are listed
 * in the sitemap but were previously reachable only through the client-rendered
 * year tabs on the organization page, which left every project page without a
 * server-rendered incoming internal link. Rendering the full list here on the
 * server gives each project page a stable link from its own organization.
 */
export const revalidate = 2592000; // 30 days, matching the organization detail page.

interface PageParams {
  params: Promise<{ slug: string }>;
}

async function loadPage(slug: string) {
  const organization = await loadOrganizationData(slug);
  if (!organization) return null;
  const projects = await loadOrganizationProjects(slug);
  return { organization, projects };
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  const canonicalSlug = canonicalOrganizationSlug(slug);
  const page = await loadPage(canonicalSlug);
  if (!page) return buildNotFoundMetadata("Organization");

  const { organization, projects } = page;
  const years = groupProjectsByYear(projects).map((group) => group.year);
  const span =
    years.length > 1 ? `${years[years.length - 1]} to ${years[0]}` : years.length === 1 ? `${years[0]}` : null;

  return buildPageMetadata({
    title: [`${organization.name} GSoC Projects`, `${organization.name} Projects`],
    description: `Browse all ${projects.length} Google Summer of Code projects accepted at ${organization.name}.`,
    descriptionExtras: [
      span ? `Covering the ${span} program years` : null,
      "Each entry links to the contributor, mentors, technologies, and source code for that project",
    ],
    path: `/organizations/${canonicalSlug}/projects`,
    image: organization.img_r2_url,
    imageAlt: `${organization.name} logo`,
  });
}

export default async function OrganizationProjectsPage({ params }: PageParams) {
  const { slug } = await params;
  const canonicalSlug = canonicalOrganizationSlug(slug);
  if (canonicalSlug !== slug) redirect(`/organizations/${canonicalSlug}/projects`);

  const page = await loadPage(canonicalSlug);
  if (!page) notFound();

  const { organization, projects } = page;
  const groups = groupProjectsByYear(projects);

  return (
    <>
      <Header />
      <main className="w-full pt-16">
        <Container size="default" className="space-y-10 py-8 lg:py-16">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link href="/organizations" className="hover:text-foreground">
              Organizations
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/organizations/${canonicalSlug}`} className="hover:text-foreground">
              {organization.name}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Projects</span>
          </nav>

          <div className="space-y-4">
            <Heading as="h1" variant="hero" className="text-3xl md:text-4xl">
              {organization.name} GSoC projects
            </Heading>
            <Text variant="lead" className="max-w-3xl text-muted-foreground">
              {projects.length > 0
                ? `Every Google Summer of Code project accepted at ${organization.name}, grouped by program year. Open a project to see its contributor, mentors, technologies, and source code.`
                : `No archived Google Summer of Code projects are recorded for ${organization.name} yet.`}
            </Text>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/organizations/${canonicalSlug}`}>
                <ArrowLeft className="size-4" /> Back to {organization.name}
              </Link>
            </Button>
          </div>

          {groups.map((group) => (
            <section key={group.year} className="space-y-4">
              <div className="flex items-center gap-3">
                <Heading as="h2" variant="small" className="text-lg">
                  <Link href={`/projects/${group.year}`} className="hover:underline">
                    GSoC {group.year}
                  </Link>
                </Heading>
                <Badge variant="secondary">
                  {group.projects.length} {group.projects.length === 1 ? "project" : "projects"}
                </Badge>
              </div>
              <ul className="grid gap-3 md:grid-cols-2">
                {group.projects.map((project) => (
                  <li key={`${group.year}-${project.project_id}`}>
                    <CardWrapper className="h-full p-4">
                      <Link
                        href={`/organizations/${canonicalSlug}/projects/${project.project_id}`}
                        className="font-medium hover:underline"
                      >
                        {project.project_title}
                      </Link>
                      {project.contributor ? (
                        <Text variant="small" className="mt-2 flex items-center gap-2 text-muted-foreground">
                          <Users className="size-4" /> {project.contributor}
                        </Text>
                      ) : null}
                      {project.tech_stack?.length ? (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {project.tech_stack.slice(0, 4).map((technology) => (
                            <Badge key={technology} variant="outline" className="text-xs">
                              {technology}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </CardWrapper>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </Container>
      </main>
      <Footer />
    </>
  );
}
