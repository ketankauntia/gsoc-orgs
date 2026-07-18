import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { absoluteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface SiteBreadcrumbItem {
  label: string;
  href?: string;
}

interface SiteBreadcrumbsProps {
  items: SiteBreadcrumbItem[];
  className?: string;
  includeJsonLd?: boolean;
}

export function SiteBreadcrumbs({
  items,
  className,
  includeJsonLd = true,
}: SiteBreadcrumbsProps) {
  const trail = items[0]?.href === "/"
    ? items
    : [{ label: "Home", href: "/" }, ...items];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(item.href) } : {}),
    })),
  };

  return (
    <>
      {includeJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
      <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
        <ol className="flex min-w-0 items-center gap-1 overflow-hidden text-sm text-muted-foreground sm:flex-wrap">
          {trail.map((item, index) => {
            const isCurrent = index === trail.length - 1;

            return (
              <li
                key={`${item.href ?? "current"}-${item.label}`}
                className="flex min-w-0 items-center gap-1"
              >
                {index > 0 && (
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground/60"
                  />
                )}
                {item.href && !isCurrent ? (
                  <Link
                    href={item.href}
                    className="whitespace-nowrap transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isCurrent ? "page" : undefined}
                    className="max-w-[min(52vw,32rem)] truncate font-medium text-foreground"
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
