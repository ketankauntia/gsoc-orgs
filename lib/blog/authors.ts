import type { Author } from "./types";

export const authors: Author[] = [
  {
    slug: "gsoc-orgs-team",
    name: "GSoC Orgs Team",
    role: "Open source research",
    initials: "GO",
    bio: "We maintain GSoC organization data and write practical notes for contributors comparing organizations, topics, and project histories.",
    websiteUrl: "/",
    followLinks: true,
  },
];

export function getAuthor(slug: string): Author {
  return authors.find((a) => a.slug === slug) ?? authors[0];
}
