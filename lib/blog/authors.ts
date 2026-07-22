import type { Author } from "./types";
import authorData from "@/content/authors.json";

export const authors = authorData as Author[];

export function getAuthor(slug: string): Author {
  return authors.find((a) => a.slug === slug) ?? authors[0];
}
