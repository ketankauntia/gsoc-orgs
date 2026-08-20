import { buildPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Code2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
import { getContributorBlogs } from "@/lib/contributor-blogs";
import { getArchiveFacets } from "@/lib/proposals/archive-search";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "GSoC Contributor Project Blogs",
  description:
    "Follow selected Google Summer of Code contributors as they document weekly project progress, technical decisions, lessons learned, and final outcomes.",
  path: "/contributor-blogs",
});

type SearchParams = { year?: string; organization?: string };

export default async function ContributorBlogsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const year = Number.parseInt(params.year ?? "", 10);
  const [blogs, facets] = await Promise.all([
    getContributorBlogs({ year: Number.isFinite(year) ? year : undefined, organization: params.organization || undefined }),
    getArchiveFacets(),
  ]);
  return <><Header /><main className="min-h-screen pt-28">
    <section className="border-b bg-linear-to-b from-primary/8 to-background"><div className="mx-auto max-w-6xl px-6 py-14 lg:px-12"><p className="text-sm font-semibold text-primary">Contributor progress</p><h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">See how selected contributors turn project plans into open-source work.</h1><p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">A curated common ground for public GSoC project blogs: weekly updates, engineering decisions, lessons learned, and final outcomes in the contributors’ own words.</p>
      <form className="mt-8 grid gap-4 rounded-2xl border bg-background p-5 sm:grid-cols-[1fr_2fr_auto]" action="/contributor-blogs"><label className="text-sm font-medium">Year<select name="year" defaultValue={params.year ?? ""} className="mt-2 h-10 w-full rounded-md border bg-background px-3"><option value="">All years</option>{facets.years.map((item) => <option key={item} value={item}>GSoC {item}</option>)}</select></label><label className="text-sm font-medium">Organization<select name="organization" defaultValue={params.organization ?? ""} className="mt-2 h-10 w-full rounded-md border bg-background px-3"><option value="">All organizations</option>{facets.organizations.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><Button className="self-end" type="submit">Filter blogs</Button></form>
    </div></section>
    <section className="mx-auto max-w-6xl px-6 py-12 lg:px-12"><div className="flex flex-wrap items-baseline justify-between gap-3"><h2 className="text-2xl font-semibold">{blogs.length.toLocaleString("en-IN")} public {blogs.length === 1 ? "blog" : "blogs"}</h2>{params.year || params.organization ? <Button asChild variant="ghost" size="sm"><Link href="/contributor-blogs">Clear filters</Link></Button> : null}</div>
      {blogs.length ? <div className="mt-7 grid gap-5 md:grid-cols-2">{blogs.map((blog) => <article key={blog.id} className="rounded-2xl border bg-card p-6"><div className="flex items-start justify-between gap-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">GSoC {blog.year} · {blog.organization_name}</p><h3 className="mt-2 text-xl font-semibold">{blog.project_title}</h3><p className="mt-2 text-sm text-muted-foreground">By {blog.contributor_name}</p></div><BookOpen className="size-6 shrink-0 text-primary" /></div><div className="mt-6 flex flex-wrap gap-2"><Button asChild><a href={blog.url} target="_blank" rel="noopener noreferrer">{blog.title || "Read project blog"}<ArrowUpRight className="size-4" /></a></Button>{blog.code_url ? <Button asChild variant="outline"><a href={blog.code_url ?? undefined} target="_blank" rel="noopener noreferrer"><Code2 className="size-4" />Code</a></Button> : null}</div></article>)}</div> : <div className="mt-7 rounded-3xl border border-dashed px-6 py-16 text-center"><h3 className="text-xl font-semibold">No contributor blogs match yet</h3><p className="mx-auto mt-3 max-w-xl text-muted-foreground">This directory is curated manually. Try a wider filter while more public project journals are reviewed and linked.</p></div>}
    </section>
  </main><Footer /></>;
}
