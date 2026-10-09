import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { loadYearlyPageData } from "@/lib/yearly-page-types";
import { buildNotFoundMetadata, buildPageMetadata } from "@/lib/seo";
import { getAvailableProjectYears } from "@/lib/projects-page-types";
import { YearDetailView } from "@/components/cobalt/views/yearly";
import { getYearWork } from "@/lib/hub/public";

// Static Generation - cache forever
export const revalidate = false;

// Derived from the single source of truth in getAvailableProjectYears().
// Adding a year there auto-updates yearly pages, project pages, and sitemap.
export async function generateStaticParams() {
  return getAvailableProjectYears().map(year => ({
    slug: `google-summer-of-code-${year}`,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const validSlugs = new Set(getAvailableProjectYears().map((year) => `google-summer-of-code-${year}`));
  if (!validSlugs.has(slug)) return buildNotFoundMetadata("GSoC Year");

  // Load data from static JSON (cached at build time)
  const data = await loadYearlyPageData(slug);
  const year = slug.replace("google-summer-of-code-", "");

  if (!data) {
    return buildPageMetadata({
      title: `GSoC ${year} Organizations`,
      description: `Explore the organizations that took part in Google Summer of Code ${year}.`,
      descriptionExtras: [
        "Compare participation, accepted projects, and technology trends for the program year",
      ],
      path: `/yearly/${slug}`,
    });
  }

  return buildPageMetadata({
    title: [data.title, `GSoC ${year} Organizations`],
    description: data.description,
    descriptionExtras: [
      `Review organization participation, accepted projects, and technology trends for Google Summer of Code ${year}`,
    ],
    path: `/yearly/${slug}`,
  });
}

export default async function YearlyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const validSlugs = new Set(getAvailableProjectYears().map((year) => `google-summer-of-code-${year}`));
  if (!validSlugs.has(slug)) notFound();

  const data = await loadYearlyPageData(slug);
  if (!data) notFound();

  // Built once; publishing a proposal or post revalidates this path (lib/hub/revalidate.ts).
  return <YearDetailView data={data} work={await getYearWork(data.year)} />;
}
