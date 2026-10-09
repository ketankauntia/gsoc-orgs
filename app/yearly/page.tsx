import { buildPageMetadata } from "@/lib/seo";
import { getAvailableProjectYears } from "@/lib/projects-page-types";
import { YearlyIndexView } from "@/components/cobalt/views/yearly";

// Static Generation - cache forever
export const revalidate = false;

export const metadata = buildPageMetadata({
  title: "GSoC Yearly Stats & Trends",
  description:
    "Explore Google Summer of Code statistics, trends, and insights for every year from 2016 to 2026, including organization and project participation.",
  path: "/yearly",
});

export default function YearlyIndexPage() {
  return <YearlyIndexView years={getAvailableProjectYears()} />;
}
