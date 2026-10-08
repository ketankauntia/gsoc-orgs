import { buildPageMetadata } from "@/lib/seo";
import { loadTechStackIndexData } from "@/lib/tech-stack-page-types";
import { TechIndexView } from "@/components/cobalt/views/tech";

// Static generation: rebuilt with the data, no request-time work.
export const revalidate = false;
export const dynamic = "force-static";

export const metadata = buildPageMetadata({
  title: "Technologies & Programming Languages",
  description:
    "Explore Google Summer of Code organizations and projects by programming language and technology, and find opportunities that match your expertise.",
  path: "/tech-stack",
});

export default async function TechStackPage() {
  const data = await loadTechStackIndexData();
  if (!data) throw new Error("Technology index data is missing.");
  return <TechIndexView data={data} />;
}
