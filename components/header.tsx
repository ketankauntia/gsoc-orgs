"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Database, Github, Menu, X } from "lucide-react";
import { AtlasMark } from "@/components/brand/atlas-mark";
import { Button } from "@/components/ui/button";
import { SOCIAL_LINKS } from "@/components/footer-common";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Organizations", href: "/organizations" },
  { name: "Projects", href: "/projects" },
  { name: "Technologies", href: "/tech-stack" },
  { name: "Topics", href: "/topics" },
  { name: "Yearly", href: "/yearly" },
  { name: "Guides", href: "/blog" },
];

interface HeaderProps {
  variant?: "default" | "home";
}

export function Header({ variant = "default" }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstMobileLinkRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === "home") {
    return (
      <header className="relative z-50 bg-white px-4 text-[#242424] sm:px-5">
        <nav
          aria-label="Primary navigation"
          className="mx-auto flex h-[4.5rem] w-full max-w-[87rem] items-center"
        >
          <Link
            href="/"
            aria-label="GSoC Atlas home"
            className="group inline-flex shrink-0 items-center gap-3 rounded-md"
          >
            <span className="flex size-10 items-center justify-center text-[#ff5e1f]">
              <AtlasMark className="size-9" />
            </span>
            <span className="text-sm font-extrabold uppercase tracking-[0.18em] sm:text-base">
              GSoC Atlas
            </span>
          </Link>

          <div className="mx-auto hidden items-center lg:flex">
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex min-h-11 items-center px-3 text-sm font-medium text-[#625e59] transition-colors duration-[180ms] hover:text-[#242424]",
                    active && "text-[#242424]",
                  )}
                >
                  {item.name}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 bottom-1 h-0.5 bg-[#ff5e1f]"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Link
              href="/about"
              className="hidden min-h-11 items-center gap-2 px-3 text-sm font-medium text-[#dc4f21] transition-colors duration-[180ms] hover:text-[#9c3211] xl:inline-flex"
            >
              <Database aria-hidden="true" className="size-4" />
              Archive notes
            </Link>
            <Button asChild variant="ghost" size="icon-sm">
              <a
                href={SOCIAL_LINKS.github.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the GSoC Atlas GitHub repository"
              >
                <Github aria-hidden="true" />
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/organizations">Explore the atlas</Link>
            </Button>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="ml-auto mr-2 lg:hidden"
          >
            <Link href="/organizations">Explore</Link>
          </Button>
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="home-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-11 items-center justify-center rounded-full border border-[#dedbd5] text-[#242424] transition-[background-color,border-color] duration-[180ms] hover:border-[#aaa49c] hover:bg-[#f5f3ef] lg:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </nav>

        <div
          id="home-mobile-navigation"
          hidden={!menuOpen}
          className="mx-auto w-full max-w-[87rem] border-t border-[#e7e4df] pb-4 pt-3 lg:hidden"
        >
          <div className="grid gap-1 sm:grid-cols-2">
            {navigation.map((item, index) => (
              <Link
                key={item.href}
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-semibold transition-colors duration-[180ms] hover:bg-[#f5f3ef]"
              >
                {item.name}
                <ArrowUpRight aria-hidden="true" className="size-4 text-[#8d8881]" />
              </Link>
            ))}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-[-1] bg-black/45 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <nav
        aria-label="Primary navigation"
        className="mx-auto w-full min-w-0 max-w-shell overflow-hidden rounded-2xl border border-white/12 bg-ink text-[#f5eee9] shadow-[0_16px_50px_rgb(0_0_0/0.2)]"
      >
        <div className="flex h-16 items-center gap-4 px-4 sm:px-5">
          <Link
            href="/"
            aria-label="GSoC Atlas home"
            className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none"
          >
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground transition-transform duration-[180ms] group-hover:rotate-3 motion-reduce:transform-none">
              <AtlasMark className="size-6" />
            </span>
            <span className="leading-none">
              <span className="block text-sm font-semibold tracking-[-0.02em]">
                GSoC Atlas
              </span>
              <span className="mt-1 hidden font-data text-[9px] uppercase tracking-[0.18em] text-[#9a9390] sm:block">
                Independent guide
              </span>
            </span>
          </Link>

          <div className="mx-auto hidden items-center lg:flex">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-10 items-center rounded-full px-3 text-[13px] font-medium text-[#b9b1ac] transition-[background-color,color] duration-[180ms] hover:bg-white/7 hover:text-white",
                    active && "bg-white/10 text-white",
                  )}
                >
                  {item.name}
                  {active ? (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-[13px] h-0.5 bg-primary"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="text-[#c8c0bb] hover:bg-white/10 hover:text-white"
            >
              <a
                href={SOCIAL_LINKS.github.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open the GSoC Atlas GitHub repository"
              >
                <Github className="size-4" strokeWidth={1.75} />
              </a>
            </Button>
            <Button asChild size="sm">
              <Link href="/organizations">
                Explore the atlas
                <ArrowUpRight className="size-3.5" strokeWidth={2} />
              </Link>
            </Button>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto flex size-11 items-center justify-center rounded-full border border-white/15 text-white transition-[background-color,border-color] duration-[180ms] hover:border-white/30 hover:bg-white/8 lg:hidden"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" strokeWidth={1.75} />
            ) : (
              <Menu aria-hidden="true" className="size-5" strokeWidth={1.75} />
            )}
          </button>
        </div>

        <div
          id="mobile-navigation"
          hidden={!menuOpen}
          className="border-t border-white/10 px-3 pb-4 pt-3 lg:hidden"
        >
          <div className="grid gap-1 sm:grid-cols-2">
            {navigation.map((item, index) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  ref={index === 0 ? firstMobileLinkRef : undefined}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-12 items-center justify-between rounded-xl px-4 text-sm font-medium text-[#c8c0bb] transition-[background-color,color] duration-[180ms] hover:bg-white/8 hover:text-white",
                    active && "bg-white/10 text-white",
                  )}
                >
                  {item.name}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-4 text-[#77716d]"
                    strokeWidth={1.5}
                  />
                </Link>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-white/10 px-1 pt-4 sm:flex-row">
            <Button asChild className="w-full sm:flex-1">
              <Link
                href="/organizations"
                onClick={() => setMenuOpen(false)}
              >
                Explore organizations
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full border-white/15 bg-transparent text-white hover:border-white/30 hover:bg-white/8 sm:w-auto"
            >
              <a
                href={SOCIAL_LINKS.github.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="size-4" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
