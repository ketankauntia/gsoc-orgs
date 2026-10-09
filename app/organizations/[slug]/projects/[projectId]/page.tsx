import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { archiveIndex, ProjectView } from "@/components/cobalt/views/projects";
import { getProjectWork } from "@/lib/hub/public";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";
import { loadOrganizationData } from "@/lib/organizations-page-types";
import {
  loadOrganizationProjects,
  type ProjectEntryWithYear,
} from "@/lib/projects-page-types";
import { loadTechStackIndexData } from "@/lib/tech-stack-page-types";

async function getProject(
  organizationSlug: string,
  projectId: string,
): Promise<ProjectEntryWithYear | null> {
  const projects = await loadOrganizationProjects(organizationSlug);
  return projects.find((entry) => entry.project_id === projectId) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}): Promise<Metadata> {
  const { slug, projectId } = await params;
  const project = await getProject(slug, projectId);
  if (!project) return buildNotFoundMetadata("Project");

  const technologies = project.tech_stack?.slice(0, 4).join(", ");
  return buildPageMetadata({
    title: [`${project.project_title} - ${project.org_name}`, project.project_title],
    description: project.project_abstract_short ?? project.project_description,
    descriptionExtras: [
      `A Google Summer of Code ${project.year} project at ${project.org_name}`,
      project.contributor ? `Completed by ${project.contributor}` : null,
      technologies ? `Built with ${technologies}` : null,
      "See the contributor, mentors, technologies, and source code for this GSoC project",
    ],
    path: `/organizations/${slug}/projects/${projectId}`,
    type: "article",
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; projectId: string }>;
}) {
  const { slug, projectId } = await params;
  const projects = await loadOrganizationProjects(slug);
  const project = projects.find((entry) => entry.project_id === projectId);
  if (!project) notFound();

  const [organization, techIndex, work] = await Promise.all([
    loadOrganizationData(project.org_slug),
    loadTechStackIndexData(),
    getProjectWork(project.project_id),
  ]);
  return (
    <ProjectView
      project={project}
      siblings={projects.filter((entry) => entry.year === project.year)}
      archive={archiveIndex(organization)}
      techPages={new Set(techIndex?.all_techs.map((tech) => tech.slug) ?? [])}
      work={work}
    />
  );
}
