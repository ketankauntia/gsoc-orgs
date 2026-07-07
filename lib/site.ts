export const siteConfig = {
  name: "GSoC Organizations Blog",
  description:
    "Guides, data notes, and contributor advice for exploring Google Summer of Code organizations.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ogImage: "/og/gsoc-organizations-guide.jpg",
  organization: {
    name: "GSoC Organizations Guide",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    logo: "/favicon.ico",
  },
} as const;

export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
