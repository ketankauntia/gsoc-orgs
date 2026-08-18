import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Code, ExternalLink, Users } from "lucide-react";
import { Badge, Button, CardWrapper, Heading, Text } from "@/components/ui";
import { getFullUrl } from "@/lib/constants";
import {
  getAvailableProjectYears,
  loadProjectsYearData,
  type ProjectEntry,
} from "@/lib/projects-page-types";
import { technologyHref } from "@/lib/vocabulary/catalog";

type ProjectWithYear = ProjectEntry & { year: number };

async function getProject(organizationSlug: string, projectId: string): Promise<ProjectWithYear | null> {
  for (const year of [...getAvailableProjectYears()].sort((a, b) => b - a)) {
    const document = await loadProjectsYearData(year);
    const project = document?.projects.find(
      (entry) => entry.project_id === projectId && entry.org_slug === organizationSlug,
    );
    if (project) return { ...project, year };
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
  if (!project) return { title: "Project Not Found", robots: { index: false, follow: false } };

  const description = project.project_abstract_short ?? project.project_description ??
    `${project.project_title}, a Google Summer of Code ${project.year} project at ${project.org_name}.`;
  const canonical = getFullUrl(`/organizations/${slug}/projects/${projectId}`);
  return {
    title: `${project.project_title} - ${project.org_name}`,
    description,
    alternates: { canonical },
    openGraph: { title: project.project_title, description, url: canonical, type: "article" },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;
  const project = await getProject(slug, projectId);
  if (!project) notFound();

  const description = project.project_description ?? project.project_abstract_short;
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12 lg:px-8">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/organizations" className="hover:text-foreground">Organizations</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/organizations/${project.org_slug}`} className="hover:text-foreground">{project.org_name}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground">{project.project_title}</span>
      </nav>

      <Button variant="ghost" size="sm" asChild>
        <Link href={`/organizations/${project.org_slug}`}>
          <ArrowLeft className="size-4" /> Back to {project.org_name}
        </Link>
      </Button>

      <section className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">GSoC {project.year}</Badge>
          {project.status ? <Badge variant="secondary">{project.status}</Badge> : null}
          {project.difficulty ? <Badge variant="secondary">{project.difficulty}</Badge> : null}
        </div>
        <Heading as="h1" variant="hero" className="text-3xl md:text-4xl">{project.project_title}</Heading>
        {description ? <Text variant="lead" className="max-w-4xl text-muted-foreground">{description}</Text> : null}
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <CardWrapper className="md:col-span-2">
          <Heading variant="small" className="mb-4">Project details</Heading>
          <div className="space-y-5">
            <div>
              <Text variant="small" className="text-muted-foreground">Contributor</Text>
              <Text className="font-medium">{project.contributor || "Not available"}</Text>
            </div>
            <div>
              <Text variant="small" className="text-muted-foreground">Mentors</Text>
              <Text className="font-medium">{project.mentors.length ? project.mentors.join(", ") : "Not available"}</Text>
            </div>
            <div className="flex flex-wrap gap-3">
              {project.project_url ? (
                <Button asChild>
                  <a href={project.project_url} target="_blank" rel="noopener noreferrer">
                    Official project <ExternalLink className="size-4" />
                  </a>
                </Button>
              ) : null}
              {project.project_code_url ? (
                <Button asChild variant="outline">
                  <a href={project.project_code_url} target="_blank" rel="noopener noreferrer">
                    <Code className="size-4" /> Source code
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </CardWrapper>

        <CardWrapper>
          <Heading variant="small" className="mb-4">Technologies</Heading>
          {project.tech_stack?.length ? (
            <div className="flex flex-wrap gap-2">
              {project.tech_stack.map((technology) => (
                <Button key={technology} asChild variant="outline" size="sm">
                  <Link href={technologyHref(technology)}>{technology}</Link>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" /> <Text variant="small">Not listed in the archive</Text>
            </div>
          )}
        </CardWrapper>
      </div>
    </main>
  );
}
