import { buildPageMetadata } from "@/lib/seo";
import { getAvailableProjectYears, loadProjectsYearData } from "@/lib/projects-page-types";
import { ProjectsIndexView } from "@/components/cobalt/views/projects";

// Static Generation - cache forever
export const revalidate = false;

export const metadata = buildPageMetadata({
  title: "GSoC Projects by Year",
  description:
    "Explore Google Summer of Code projects year by year. Browse accepted projects, participating organizations, and technology trends from 2016 onwards.",
  path: "/projects",
});

export default async function ProjectsIndexPage() {
  // Summary per year, read at build time.
  const years = await Promise.all(
    getAvailableProjectYears().map(async (year) => {
      const data = await loadProjectsYearData(year);
      return {
        year,
        listed: data?.metrics.total_projects ?? 0,
      };
    }),
  );
  return <ProjectsIndexView years={years} />;
}
