import Link from "next/link";
import { ArrowUpRight, Github } from "lucide-react";
import { AtlasMark } from "@/components/brand/atlas-mark";
import {
  FOOTER_COPYRIGHT,
  FOOTER_NAVIGATION_ITEMS,
  SOCIAL_LINKS,
} from "@/components/footer-common";

interface FooterProps {
  variant?: "default" | "home";
}

export function Footer({ variant = "default" }: FooterProps) {
  if (variant === "home") {
    return (
      <footer className="bg-white px-5 pb-7 pt-14 text-[#242424] sm:px-8 lg:pt-18">
        <div className="mx-auto max-w-[87rem]">
          <Link
            href="/"
            aria-label="GSoC Atlas home"
            className="inline-flex items-center gap-3"
          >
            <AtlasMark className="size-8 text-[#ff5e1f]" />
            <span className="text-sm font-extrabold uppercase tracking-[0.18em]">
              GSoC Atlas
            </span>
          </Link>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr] lg:gap-14">
            <div>
              <p className="max-w-xs text-sm leading-6 text-[#706b65]">
                An independent research guide for exploring public Google
                Summer of Code organization and project history.
              </p>
              <a
                href={SOCIAL_LINKS.github.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dedbd5] px-4 text-sm font-semibold transition-[background-color,border-color] duration-[180ms] hover:border-[#242424] hover:bg-[#f5f3ef]"
              >
                <Github aria-hidden="true" className="size-4" />
                GitHub
              </a>
            </div>

            {FOOTER_NAVIGATION_ITEMS.map((group) => (
              <nav key={group.title} aria-label={`${group.title} links`}>
                <p className="text-sm font-semibold">{group.title}</p>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => {
                    const external = item.href.startsWith("http");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 text-sm text-[#706b65] transition-colors duration-[180ms] hover:text-[#242424]"
                        >
                          {item.title}
                          {external ? (
                            <ArrowUpRight aria-hidden="true" className="size-3" />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>

          <div className="mt-16 flex flex-col gap-4 border-t border-dashed border-[#dedbd5] pt-6 text-xs text-[#77716c] sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {FOOTER_COPYRIGHT.year} {FOOTER_COPYRIGHT.organization}.{" "}
              {FOOTER_COPYRIGHT.text}.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <Link href="/privacy-policy" className="hover:text-[#242424]">
                Privacy policy
              </Link>
              <span aria-hidden="true">|</span>
              <Link
                href="/terms-and-conditions"
                className="hover:text-[#242424]"
              >
                Terms of use
              </Link>
              <span aria-hidden="true">|</span>
              <span>Not affiliated with Google</span>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-ink px-3 pb-3 text-[#f5eee9] sm:px-5 sm:pb-5">
      <div className="mx-auto max-w-shell overflow-hidden rounded-[1.5rem] border border-white/10 bg-ink-soft">
        <div className="grid gap-12 border-b border-white/10 px-6 py-14 sm:px-8 lg:grid-cols-[1.2fr_2fr] lg:px-12 lg:py-20">
          <div className="max-w-lg">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-lg"
              aria-label="GSoC Atlas home"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <AtlasMark className="size-7" />
              </span>
              <span>
                <span className="block text-lg font-semibold tracking-[-0.03em]">
                  GSoC Atlas
                </span>
                <span className="font-data text-[10px] uppercase tracking-[0.18em] text-[#9a9390]">
                  Organizations guide
                </span>
              </span>
            </Link>

            <h2 className="mt-8 max-w-md text-3xl font-medium leading-[1.05] tracking-[-0.04em] sm:text-4xl">
              Turn the GSoC archive into a focused next step.
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-[#aaa29d]">
              Explore organizations, projects, technologies, topics, and program
              history in one independent research tool.
            </p>

            <a
              href={SOCIAL_LINKS.github.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-semibold transition-[background-color,border-color] duration-[180ms] hover:border-white/30 hover:bg-white/8 active:scale-[0.96]"
            >
              <Github aria-hidden="true" className="size-4" />
              Build with us on GitHub
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            {FOOTER_NAVIGATION_ITEMS.map((group) => (
              <nav key={group.title} aria-label={`${group.title} links`}>
                <p className="font-data text-[10px] uppercase tracking-[0.18em] text-[#7e7773]">
                  {group.title}
                </p>
                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => {
                    const external = item.href.startsWith("http");
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                          className="inline-flex items-center gap-1.5 text-sm text-[#c8c0bb] transition-colors duration-[180ms] hover:text-white"
                        >
                          {item.title}
                          {external ? (
                            <ArrowUpRight
                              aria-hidden="true"
                              className="size-3"
                            />
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-6 font-data text-[10px] uppercase tracking-[0.12em] text-[#817a76] sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <p>
            © {FOOTER_COPYRIGHT.year} {FOOTER_COPYRIGHT.organization}.{" "}
            {FOOTER_COPYRIGHT.text}.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="hover:text-[#c8c0bb]">
              Privacy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-[#c8c0bb]">
              Terms
            </Link>
            <span>Not affiliated with Google</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
