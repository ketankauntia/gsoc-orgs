import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export const dynamic = "force-dynamic";

/** Saves a post from the /editor UI. Dev-only by design — the prod deployment ships content read-only; the save target/structure is revisited later (see plan Phase 4). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "The editor can only save in development" }, { status: 403 });
  }

  const { slug } = await params;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ error: "Invalid slug — use lowercase words separated by hyphens" }, { status: 400 });
  }

  const { frontmatter, body } = (await req.json()) as {
    frontmatter: Record<string, unknown>;
    body: string;
  };
  if (typeof body !== "string" || typeof frontmatter?.title !== "string") {
    return Response.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Drop empty optional fields so files stay clean
  const clean = Object.fromEntries(
    Object.entries(frontmatter).filter(
      ([, v]) => v !== "" && v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0),
    ),
  );

  const file = matter.stringify("\n" + body.trim() + "\n", clean);
  const target = path.join(process.cwd(), "content", "posts", `${slug}.md`);
  fs.writeFileSync(target, file, "utf8");

  return Response.json({ ok: true, path: `content/posts/${slug}.md` });
}
