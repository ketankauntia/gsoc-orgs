import Link from "next/link";
import { IconRss } from "@tabler/icons-react";
import { ArrowUpRight } from "lucide-react";
import { AtlasMark } from "@/components/brand/atlas-mark";
import { FOOTER_COPYRIGHT } from "@/components/footer-common";

const FOOTER_LINKS = [
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms-and-conditions" },
];

const PUBLIC_FOOTER_LINKS = [
  { label: "Organizations", href: "/organizations" },
  { label: "Projects", href: "/projects" },
  { label: "Technologies", href: "/tech-stack" },
  { label: "Topics", href: "/topics" },
  ...FOOTER_LINKS,
];

interface BlogSiteFooterProps {
  variant?: "dashboard" | "public";
}

export function BlogSiteFooter({
  variant = "dashboard",
}: BlogSiteFooterProps) {
  if (variant === "public") {
    return (
      <footer className="mt-auto bg-ink px-3 pb-3 text-[#f5eee9] sm:px-5 sm:pb-5">
        <div className="mx-auto max-w-shell overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink-soft">
          <div className="grid gap-12 border-b border-white/10 px-6 py-12 sm:px-8 lg:grid-cols-[1.25fr_1fr] lg:px-12 lg:py-16">
            <div className="max-w-xl">
              <Link
                href="/"
                aria-label="GSoC Atlas home"
                className="inline-flex items-center gap-3 rounded-lg"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <AtlasMark className="size-7" />
                </span>
                <span>
                  <span className="block text-lg font-semibold tracking-[-0.03em]">
                    GSoC Atlas
                  </span>
                  <span className="font-data text-[10px] uppercase tracking-[0.18em] text-[#9a9390]">
                    Field guides
                  </span>
                </span>
              </Link>

              <h2 className="mt-8 max-w-lg text-3xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-4xl">
                Read the archive like a contributor, not a spectator.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-6 text-[#aaa29d]">
                Practical research notes for understanding organizations,
                project history, technologies, and the work that comes before a
                strong proposal.
              </p>

              <Link
                href="/organizations"
                className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-[background-color,transform] duration-[180ms] hover:bg-brand-hover active:scale-[0.96] motion-reduce:transform-none"
              >
                Explore organizations
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </div>

            <nav aria-label="Guide footer links">
              <p className="font-data text-[10px] uppercase tracking-[0.18em] text-[#7e7773]">
                Continue exploring
              </p>
              <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {PUBLIC_FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-8 items-center text-sm text-[#c8c0bb] transition-colors duration-[180ms] hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href="/rss.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-8 items-center gap-1.5 text-sm text-[#c8c0bb] transition-colors duration-[180ms] hover:text-white"
                    aria-label="Open the RSS feed"
                  >
                    <IconRss aria-hidden="true" className="size-4" />
                    RSS feed
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <div className="flex flex-col gap-3 px-6 py-6 font-data text-[10px] uppercase tracking-[0.12em] text-[#817a76] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <p>
              {"\u00A9"} {FOOTER_COPYRIGHT.year}{" "}
              {FOOTER_COPYRIGHT.organization}
            </p>
            <p>Independent guide | Not affiliated with Google</p>
          </div>
        </div>
      </footer>
    );
  }

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
