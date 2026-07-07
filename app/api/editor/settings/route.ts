import fs from "node:fs";
import path from "node:path";
import { BLOG_TEMPLATES, POST_TEMPLATES, type SiteSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Persists dashboard settings to content/settings.json. Dev-only, like post saves. */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Settings can only be saved in development" }, { status: 403 });
  }

  const body = (await req.json()) as Partial<SiteSettings>;
  if (
    !BLOG_TEMPLATES.includes(body.blogTemplate as never) ||
    !POST_TEMPLATES.includes(body.postTemplate as never)
  ) {
    return Response.json({ error: "Invalid template value" }, { status: 400 });
  }

  const settings: SiteSettings = {
    blogTemplate: body.blogTemplate!,
    postTemplate: body.postTemplate!,
  };
  fs.writeFileSync(
    path.join(process.cwd(), "content", "settings.json"),
    JSON.stringify(settings, null, 2) + "\n",
    "utf8",
  );
  return Response.json({ ok: true });
}
