import { getAllPosts } from "@/lib/blog/content";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-static";
// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

/** llms.txt — a markdown index of the blog written for LLM crawlers (llmstxt.org). Each post links to its raw-markdown version. */
export function GET() {
  const posts = getAllPosts();
  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## Posts",
    "",
    ...posts.map(
      (p) =>
        `- [${p.title}](${absoluteUrl(`/blog/post/${p.slug}.md`)}): ${p.description}`,
    ),
  ];
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
