import "server-only";
import fs from "node:fs";
import path from "node:path";
import bundledSources from "@/lib/generated/blog-sources.json";

const sources: Record<string, string> = bundledSources;
const postsDir = path.join(process.cwd(), "content", "posts");

// Production workers read bundled content. The local editor still reads live files.
export function postSourceFiles(): string[] {
  return process.env.NODE_ENV === "production"
    ? Object.keys(sources)
    : fs.readdirSync(postsDir).filter((file) => file.endsWith(".md"));
}

export function readPostSource(file: string): string | undefined {
  if (process.env.NODE_ENV === "production") return sources[file];
  const target = path.join(postsDir, file);
  return fs.existsSync(target) ? fs.readFileSync(target, "utf8") : undefined;
}
