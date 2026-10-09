// Classifies the final work-product link Google's archive publishes for each
// project, so pages can label it ("Final report", "Code", "Gist", ...).

export type WorkProductKind = "report_blog" | "gist" | "repo_pr" | "docs" | "org_site" | "other";

const CODE_HOSTS = ["github.com", "gitlab.com", "bitbucket.org", "codeberg.org", "sourceforge.net", "sr.ht", "gitee.com"];
const DOC_HOSTS = ["docs.google.com", "drive.google.com", "sites.google.com", "notion.so", "notion.site", "hackmd.io", "dropbox.com", "overleaf.com"];
const BLOG_HOST_SUFFIXES = [
  "github.io", "gitlab.io", "medium.com", "wordpress.com", "blogspot.com", "hashnode.dev", "hashnode.com",
  "dev.to", "substack.com", "netlify.app", "vercel.app", "pages.dev", "wixsite.com", "weebly.com", "ghost.io", "tumblr.com",
];

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function matches(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

/** Last two labels of a host ("blog.kde.org" -> "kde.org"); good enough to match an org's own site. */
function siteOf(host: string) {
  return host.split(".").slice(-2).join(".");
}

export function workProductKind(url: string | null | undefined, organizationWebsite?: string | null): WorkProductKind | null {
  const host = hostOf(url);
  if (!host) return null;
  if (host === "gist.github.com") return "gist";
  if (CODE_HOSTS.some((domain) => matches(host, domain)) || host.startsWith("git.") || host.startsWith("gitlab.")) return "repo_pr";
  if (DOC_HOSTS.some((domain) => matches(host, domain))) return "docs";
  if (BLOG_HOST_SUFFIXES.some((domain) => matches(host, domain)) || /(^|\.)blogspot\.[a-z.]+$/.test(host)) return "report_blog";
  const orgHost = hostOf(organizationWebsite);
  if (orgHost && siteOf(orgHost) === siteOf(host)) return "org_site";
  return "other";
}

/** One-word labels for compact project rows. */
export const WORK_PRODUCT_SHORT_LABELS: Record<WorkProductKind, string> = {
  report_blog: "Report",
  gist: "Summary",
  repo_pr: "Code",
  docs: "Report",
  org_site: "Report",
  other: "Work",
};

export function workProductShortLabel(url: string | null | undefined) {
  const kind = workProductKind(url);
  return kind ? WORK_PRODUCT_SHORT_LABELS[kind] : "Work";
}

export function workProductLabel(url: string | null | undefined) {
  const kind = workProductKind(url);
  return kind ? WORK_PRODUCT_LABELS[kind] : "Final work product";
}

export const WORK_PRODUCT_LABELS: Record<WorkProductKind, string> = {
  report_blog: "Final report",
  gist: "Work summary (gist)",
  repo_pr: "Code",
  docs: "Report document",
  org_site: "Report on the organization's site",
  other: "Final work product",
};
