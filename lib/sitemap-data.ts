import { SITE_URL } from "@/lib/constants";
import { loadOrganizationsIndexData } from "@/lib/organizations-page-types";
import { getAvailableProjectYears, loadProjectsYearData } from "@/lib/projects-page-types";
import { loadTechStackIndexData } from "@/lib/tech-stack-page-types";
import { loadTopicsIndexData } from "@/lib/topics-page-types";
import { loadYearlyPageData } from "@/lib/yearly-page-types";
import { categoryToSlug, getIndexablePosts, paginate } from "@/lib/blog/content";
import { getApprovedProposalSitemapEntries } from "@/lib/proposals/queries";
import type { SitemapUrlEntry } from "@/lib/sitemap-xml";
import { isTaxonomyIndexEligible } from "@/lib/search-index-policy";

const baseUrl = SITE_URL.replace(/\/$/, "").replace(/^http:/, "https:");
const projectYears = getAvailableProjectYears();

export const SITEMAP_FILES = [
  "static.xml",
  "organizations.xml",
  ...projectYears.map((year) => `projects-${year}.xml`),
  "cycles.xml",
  "taxonomies.xml",
  "articles.xml",
  "proposals.xml",
] as const;

export function absoluteSitemapUrl(pathname: string): string {
  return `${baseUrl}${pathname}`;
}

function validLastModified(value?: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function latest(values: Array<string | undefined>): string | undefined {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1);
}

function staticEntries(): SitemapUrlEntry[] {
  return [
    "",
    "/about",
    "/contact",
    "/privacy-policy",
    "/terms-and-conditions",
    "/changelog",
    "/contributor-blogs",
  ].map((pathname) => ({ url: absoluteSitemapUrl(pathname) }));
}

async function organizationEntries(): Promise<SitemapUrlEntry[]> {
  const data = await loadOrganizationsIndexData();
  if (!data) return [];
  const lastModified = validLastModified(data.published_at);
  return [
    { url: absoluteSitemapUrl("/organizations"), lastModified },
    ...data.organizations.flatMap((organization) => [
      {
        url: absoluteSitemapUrl(`/organizations/${encodeURIComponent(organization.slug)}`),
        lastModified,
      },
      {
        url: absoluteSitemapUrl(`/organizations/${encodeURIComponent(organization.slug)}/projects`),
        lastModified,
      },
    ]),
  ];
}

async function projectEntries(year: number): Promise<SitemapUrlEntry[]> {
  const data = await loadProjectsYearData(year);
  if (!data) return [];
  const fallbackLastModified = validLastModified(data.published_at);
  return [
    { url: absoluteSitemapUrl(`/projects/${year}`), lastModified: fallbackLastModified },
    ...data.projects.map((project) => ({
      url: absoluteSitemapUrl(
        `/organizations/${encodeURIComponent(project.org_slug)}/projects/${encodeURIComponent(project.project_id)}`,
      ),
      lastModified: validLastModified(project.date_updated ?? project.date_created) ?? fallbackLastModified,
    })),
  ];
}

async function cycleEntries(): Promise<SitemapUrlEntry[]> {
  const entries: SitemapUrlEntry[] = [
    { url: absoluteSitemapUrl("/projects") },
    { url: absoluteSitemapUrl("/yearly") },
  ];
  for (const year of projectYears) {
    const slug = `google-summer-of-code-${year}`;
    const data = await loadYearlyPageData(slug);
    entries.push({
      url: absoluteSitemapUrl(`/yearly/${slug}`),
      lastModified: validLastModified(data?.published_at),
    });
  }
  return entries;
}

async function taxonomyEntries(): Promise<SitemapUrlEntry[]> {
  const [technologies, topics] = await Promise.all([
    loadTechStackIndexData(),
    loadTopicsIndexData(),
  ]);
  const technologyLastModified = validLastModified(technologies?.published_at);
  const topicLastModified = validLastModified(topics?.published_at);
  return [
    { url: absoluteSitemapUrl("/tech-stack"), lastModified: technologyLastModified },
    { url: absoluteSitemapUrl("/topics"), lastModified: topicLastModified },
    ...(technologies?.all_techs ?? [])
      .filter((technology) => isTaxonomyIndexEligible(technology.org_count, technology.project_count))
      .map((technology) => ({
        url: absoluteSitemapUrl(`/tech-stack/${encodeURIComponent(technology.slug)}`),
        lastModified: technologyLastModified,
      })),
    ...(topics?.topics ?? [])
      .filter((topic) => isTaxonomyIndexEligible(topic.organizationCount, topic.projectCount))
      .map((topic) => ({
        url: absoluteSitemapUrl(`/topics/${encodeURIComponent(topic.slug)}`),
        lastModified: topicLastModified,
      })),
  ];
}

function articleEntries(): SitemapUrlEntry[] {
  const posts = getIndexablePosts();
  const postLastModified = (post: (typeof posts)[number]) => validLastModified(post.updatedAt ?? post.publishedAt);
  const overallLastModified = latest(posts.map(postLastModified));
  const entries: SitemapUrlEntry[] = [
    { url: absoluteSitemapUrl("/blog"), lastModified: overallLastModified },
    ...posts.map((post) => ({
      url: absoluteSitemapUrl(`/blog/post/${encodeURIComponent(post.slug)}`),
      lastModified: postLastModified(post),
    })),
  ];

  const blogPages = paginate(posts, 1).totalPages;
  for (let page = 2; page <= blogPages; page++) {
    entries.push({ url: absoluteSitemapUrl(`/blog/page/${page}`), lastModified: overallLastModified });
  }

  const categories = [...new Set(posts.map((post) => post.category))];
  for (const category of categories) {
    const categoryPosts = posts.filter((post) => post.category === category);
    const categoryLastModified = latest(categoryPosts.map(postLastModified));
    const slug = categoryToSlug(category);
    entries.push({ url: absoluteSitemapUrl(`/blog/category/${slug}`), lastModified: categoryLastModified });
    const categoryPages = paginate(categoryPosts, 1).totalPages;
    for (let page = 2; page <= categoryPages; page++) {
      entries.push({
        url: absoluteSitemapUrl(`/blog/category/${slug}/page/${page}`),
        lastModified: categoryLastModified,
      });
    }
  }

  const authors = [...new Set(posts.map((post) => post.authorSlug))];
  for (const author of authors) {
    const authorPosts = posts.filter((post) => post.authorSlug === author);
    entries.push({
      url: absoluteSitemapUrl(`/blog/author/${encodeURIComponent(author)}`),
      lastModified: latest(authorPosts.map(postLastModified)),
    });
  }
  return entries;
}

async function proposalEntries(): Promise<SitemapUrlEntry[]> {
  const proposals = await getApprovedProposalSitemapEntries();
  return [
    { url: absoluteSitemapUrl("/proposals") },
    ...proposals.map((proposal) => ({
      url: absoluteSitemapUrl(`/proposals/${encodeURIComponent(proposal.public_slug)}`),
      lastModified: validLastModified(proposal.approved_at),
    })),
  ];
}

export async function getSitemapEntries(file: string): Promise<SitemapUrlEntry[] | null> {
  if (file === "static.xml") return staticEntries();
  if (file === "organizations.xml") return organizationEntries();
  if (file === "cycles.xml") return cycleEntries();
  if (file === "taxonomies.xml") return taxonomyEntries();
  if (file === "articles.xml") return articleEntries();
  if (file === "proposals.xml") return proposalEntries();
  const projectMatch = /^projects-(\d{4})\.xml$/.exec(file);
  if (projectMatch) {
    const year = Number(projectMatch[1]);
    if (!projectYears.includes(year)) return null;
    return projectEntries(year);
  }
  return null;
}
