import Link from "next/link";
import { IconRss } from "@tabler/icons-react";

const FOOTER_LINKS = [
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-conditions" },
];

export function BlogSiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-shell flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} GSoC Organizations Guide.</p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </Link>
          ))}
          <a
            href="/rss.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
            aria-label="RSS feed"
          >
            <IconRss className="size-4" />
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
