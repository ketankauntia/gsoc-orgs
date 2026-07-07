"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type TocItem = { id: string; heading: string };

/** Anchor list with scroll-spy highlighting. Sticky in the sidebar on desktop. */
export function TableOfContents({ items, hasFaqs = false }: { items: TocItem[]; hasFaqs?: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Only spy on anchors that actually exist on the page.
  const spiedIds = hasFaqs ? [...items.map((i) => i.id), "faqs"] : items.map((i) => i.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const id of spiedIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [spiedIds.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  if (items.length === 0 && !hasFaqs) return null;

  return (
    <nav aria-label="Table of contents">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1 border-l text-sm">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "-ml-px block border-l-2 py-1 pl-3 text-muted-foreground transition-colors hover:text-foreground",
                activeId === item.id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent",
              )}
            >
              {item.heading}
            </a>
          </li>
        ))}
        {hasFaqs && (
          <li>
            <a
              href="#faqs"
              className={cn(
                "-ml-px block border-l-2 py-1 pl-3 text-muted-foreground transition-colors hover:text-foreground",
                activeId === "faqs" ? "border-primary font-medium text-primary" : "border-transparent",
              )}
            >
              FAQs
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}
