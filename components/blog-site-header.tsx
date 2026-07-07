import Link from "next/link";
import { Button } from "@/components/blog-ui/button";
import { BlogThemeToggle } from "@/components/blog-theme-toggle";
import { HeaderSearch } from "@/components/blog/header-search";

export function BlogSiteHeader() {
  const showDashboard = process.env.NODE_ENV !== "production";

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
