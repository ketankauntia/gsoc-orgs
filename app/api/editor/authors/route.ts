import fs from "node:fs";
import path from "node:path";
import type { Author } from "@/lib/blog/types";

export const dynamic = "force-dynamic";

const AUTHORS_PATH = path.join(process.cwd(), "content", "authors.json");
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Authors can only be created in development" }, { status: 403 });
  }

  const input = (await req.json()) as Partial<Author>;
  const slug = input.slug?.trim() ?? "";
  const name = input.name?.trim() ?? "";
  const role = input.role?.trim() ?? "";
  const bio = input.bio?.trim() ?? "";

  if (!SLUG_PATTERN.test(slug)) {
    return Response.json({ error: "Use a lowercase author slug separated by hyphens" }, { status: 400 });
  }
  if (!name || !role || !bio) {
    return Response.json({ error: "Name, role, and bio are required" }, { status: 400 });
  }

  const authors = JSON.parse(fs.readFileSync(AUTHORS_PATH, "utf8")) as Author[];
  if (authors.some((author) => author.slug === slug)) {
    return Response.json({ error: "An author with this slug already exists" }, { status: 409 });
  }

  const author: Author = {
    slug,
    name,
    role,
    bio,
    initials: normalizeInitials(input.initials, name),
    ...(optionalUrl(input.avatarUrl) && { avatarUrl: optionalUrl(input.avatarUrl) }),
    ...(optionalUrl(input.websiteUrl) && { websiteUrl: optionalUrl(input.websiteUrl) }),
    ...(optionalUrl(input.githubUrl) && { githubUrl: optionalUrl(input.githubUrl) }),
    ...(optionalUrl(input.linkedinUrl) && { linkedinUrl: optionalUrl(input.linkedinUrl) }),
    ...(optionalUrl(input.twitterUrl) && { twitterUrl: optionalUrl(input.twitterUrl) }),
    followLinks: Boolean(input.followLinks),
  };

  authors.push(author);
  fs.writeFileSync(AUTHORS_PATH, `${JSON.stringify(authors, null, 2)}\n`, "utf8");
  return Response.json({ ok: true, author }, { status: 201 });
}

function normalizeInitials(value: string | undefined, name: string): string {
  const provided = value?.trim().toUpperCase();
  if (provided) return provided.slice(0, 3);
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function optionalUrl(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (normalized.startsWith("/") || /^https?:\/\//i.test(normalized)) return normalized;
  return undefined;
}
