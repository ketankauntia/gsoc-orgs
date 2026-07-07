import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

const ALLOWED = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
  ["image/svg+xml", "svg"],
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

/** Slugify the original filename stem for a clean, stable URL. */
function slugStem(name: string): string {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  );
}

/**
 * Saves an uploaded image into public/blog/<post-slug>/ and returns its public path.
 * Per-post folders keep assets structured: a post's images live and travel with its slug;
 * uploads from an unsaved/new draft land in public/blog/misc/.
 * Dev-only by design (the deployed content dir is read-only).
 */
export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Uploads are only available in development" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return Response.json({ error: `Unsupported type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File exceeds 8 MB" }, { status: 413 });
  }

  // Post slug decides the folder; strict whitelist prevents traversal.
  const rawSlug = String(form.get("slug") ?? "");
  const folder = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(rawSlug) ? rawSlug : "misc";

  const dir = path.join(process.cwd(), "public", "blog", folder);
  fs.mkdirSync(dir, { recursive: true });

  // Deterministic, collision-safe name: <stem>-<size>.<ext> (stable on re-upload of the same file).
  let base = `${slugStem(file.name)}-${file.size}.${ext}`;
  let n = 1;
  while (fs.existsSync(path.join(dir, base)) && n < 100) {
    base = `${slugStem(file.name)}-${file.size}-${n}.${ext}`;
    n++;
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(dir, base), bytes);

  return Response.json({ path: `/blog/${folder}/${base}` });
}
