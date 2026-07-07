import { getAllPosts } from "@/lib/blog/content";
import { postToFeedHtml } from "@/lib/blog/feed-html";
import { getAuthor } from "@/lib/blog/authors";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamic = "force-static";
// ISR: regenerate hourly so scheduled posts + content changes surface without a rebuild.
export const revalidate = 3600;

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Wrap HTML in CDATA safely (guard against a literal ]]> in the content). */
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function rfc822(isoDate: string): string {
  return new Date(isoDate + "T00:00:00Z").toUTCString();
}

export function GET() {
  const posts = getAllPosts();
  const lastBuild = posts[0] ? rfc822(posts[0].updatedAt ?? posts[0].publishedAt) : new Date(0).toUTCString();

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blog/post/${post.slug}`);
      const author = getAuthor(post.authorSlug);
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(post.publishedAt)}</pubDate>
      <dc:creator>${escapeXml(author.name)}</dc:creator>
      <category>${escapeXml(post.category)}</category>
      <description>${escapeXml(post.description)}</description>
      <content:encoded>${cdata(postToFeedHtml(post))}</content:encoded>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(siteConfig.name)}</title>
    <link>${absoluteUrl("/blog")}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>GSoC Organizations Blog (Next.js)</generator>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${absoluteUrl(siteConfig.ogImage)}</url>
      <title>${escapeXml(siteConfig.name)}</title>
      <link>${absoluteUrl("/blog")}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
