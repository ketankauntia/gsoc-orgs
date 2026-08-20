import Link from "next/link";

import { Heading, Text } from "@/components/ui";

export interface DirectoryEntry {
  href: string;
  label: string;
}

interface LinkDirectoryProps {
  title: string;
  description?: string;
  entries: DirectoryEntry[];
  headingAs?: "h2" | "h3";
}

/**
 * A complete, server-rendered A–Z index of a page collection.
 *
 * Listing pages here paginate or filter on the client, which leaves the pages
 * beyond the first slice without any crawlable incoming link and reported as
 * orphans. This block renders every destination once so each detail page keeps a
 * stable link from its own listing page.
 */
export function LinkDirectory({ title, description, entries, headingAs = "h2" }: LinkDirectoryProps) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) =>
    a.label.localeCompare(b.label, "en", { sensitivity: "base" }),
  );

  return (
    <section className="border-t pt-8">
      <Heading as={headingAs} variant="small" className="text-lg">
        {title}
      </Heading>
      {description ? (
        <Text variant="small" className="mt-2 text-muted-foreground">
          {description}
        </Text>
      ) : null}
      <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((entry) => (
          <li key={entry.href} className="truncate">
            <Link href={entry.href} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              {entry.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
