import Link from "next/link";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Crawlable numbered pagination — real <a href> links (Google dropped rel=next/prev in 2019).
 * `basePath` is the listing root, e.g. "/blog" or "/blog/category/foo"; page 1 lives at basePath itself.
 */
export function Pagination({
  basePath,
  page,
  totalPages,
}: {
  basePath: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p === 1 ? basePath : `${basePath}/page/${p}`);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      <PageLink
        href={href(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        rel="prev"
      >
        <IconChevronLeft className="size-4" />
      </PageLink>

      {pages.map((p) => (
        <PageLink key={p} href={href(p)} active={p === page} aria-label={`Page ${p}`}>
          {p}
        </PageLink>
      ))}

      <PageLink href={href(page + 1)} disabled={page === totalPages} aria-label="Next page" rel="next">
        <IconChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
  ...rest
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const className = cn(
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm transition-colors",
    active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
    disabled && "pointer-events-none opacity-40",
  );
  // Disabled prev/next render as spans so they aren't crawlable dead links.
  if (disabled) {
    return (
      <span aria-hidden className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}
