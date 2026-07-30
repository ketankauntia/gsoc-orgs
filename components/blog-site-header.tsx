import Link from "next/link";
import { AtlasMark } from "@/components/brand/atlas-mark";
import { Button } from "@/components/blog-ui/button";
import { BlogThemeToggle } from "@/components/blog-theme-toggle";
import { HeaderSearch } from "@/components/blog/header-search";

interface BlogSiteHeaderProps {
  variant?: "dashboard" | "public";
}

const PUBLIC_LINKS = [
  { label: "Organizations", href: "/organizations" },
  { label: "Projects", href: "/projects" },
  { label: "Technologies", href: "/tech-stack" },
  { label: "Yearly", href: "/yearly" },
] as const;

export function BlogSiteHeader({
  variant = "dashboard",
}: BlogSiteHeaderProps) {
  const showDashboard = process.env.NODE_ENV !== "production";

  if (variant === "public") {
    return (
      <header className="sticky top-0 z-50 bg-background/92 px-3 py-3 backdrop-blur-xl sm:px-5">
        <nav
          aria-label="Guide navigation"
          className="mx-auto flex min-h-16 w-full max-w-shell items-center gap-3 rounded-2xl border border-white/12 bg-ink px-3 text-[#f5eee9] shadow-[0_16px_50px_rgb(0_0_0/0.16)] sm:px-4"
        >
          <Link
            href="/"
            aria-label="GSoC Atlas home"
            className="group flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform duration-[180ms] group-hover:rotate-3 motion-reduce:transform-none">
              <AtlasMark className="size-6" />
            </span>
            <span className="hidden min-w-0 leading-none sm:block">
              <span className="block truncate text-sm font-semibold tracking-[-0.02em]">
                GSoC Atlas
              </span>
              <span className="mt-1 block font-data text-[9px] uppercase tracking-[0.18em] text-[#9a9390]">
                Field guides
              </span>
            </span>
          </Link>

          <div className="mx-auto hidden items-center lg:flex">
            {PUBLIC_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-11 items-center rounded-full px-3 text-[13px] font-medium text-[#b9b1ac] transition-[background-color,color] duration-[180ms] hover:bg-white/7 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/blog"
              aria-current="page"
              className="relative flex min-h-11 items-center rounded-full bg-white/10 px-3 text-[13px] font-medium text-white"
            >
              Guides
              <span
                aria-hidden="true"
                className="absolute inset-x-3 -bottom-[10px] h-0.5 bg-primary"
              />
            </Link>
          </div>

          <div className="ml-auto flex min-w-0 items-center gap-1 rounded-xl bg-[#f5eee9] p-1 text-[#171615] [&_button]:size-11 [&_input]:h-11 [&_input]:w-32 sm:[&_input]:w-56 md:[&_input]:w-72">
            {showDashboard ? (
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden lg:inline-flex"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : null}
            <HeaderSearch />
            <span className="hidden md:block">
              <BlogThemeToggle />
            </span>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-shell items-center justify-between px-4 sm:px-6">
        <Link href="/blog" className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary font-heading text-sm font-bold text-primary-foreground">
            G
          </span>
          <span className="font-heading text-base font-semibold tracking-tight">
            GSoC Orgs <span className="font-normal text-muted-foreground">Blog</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {showDashboard ? (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : null}
          <HeaderSearch />
          <BlogThemeToggle />
        </nav>
      </div>
    </header>
  );
}
