import Link from "next/link";
import { Badge } from "@/components/blog-ui/badge";
import { cn } from "@/lib/utils";

type CategoryLink = { label: string; slug: string };

/** Category filter chips linking to static category routes. Shared by the index and category pages. */
export function CategoryChips({
  categories,
  activeSlug,
}: {
  categories: CategoryLink[];
  activeSlug?: string;
}) {
  return (
    <nav aria-label="Filter by category" className="mt-6 flex flex-wrap gap-2">
      <Chip label="All" href="/blog" active={!activeSlug} />
      {categories.map((c) => (
        <Chip
          key={c.slug}
          label={c.label}
          href={`/blog/category/${c.slug}`}
          active={activeSlug === c.slug}
        />
      ))}
    </nav>
  );
}

function Chip({ label, href, active }: { label: string; href: string; active: boolean }) {
  return (
    <Link href={href}>
      <Badge
        variant={active ? "default" : "outline"}
        className={cn("px-3 py-1 text-sm", !active && "hover:bg-accent")}
      >
        {label}
      </Badge>
    </Link>
  );
}
