"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import React from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "@/components/footer-common";
import { GitHubIcon, XIcon } from "@/components/icons";
import { ModeToggle } from "./ModeToggle";
import { AuthNav } from "@/components/auth/auth-nav";

const CURRENT_EDITION = "/yearly/google-summer-of-code-2026";

const menuItems = [
  { name: "GSoC 2026", href: CURRENT_EDITION, badge: "Current" },
  { name: "Organizations", href: "/organizations" },
  { name: "Proposals", href: "/proposals" },
  { name: "Blog", href: "/blog" },
  { name: "Past editions", href: "/yearly" },
];

function isMenuItemActive(pathname: string, href: string) {
  if (href === "/yearly") {
    return pathname.startsWith("/yearly") && pathname !== CURRENT_EDITION;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const Header = () => {
  const pathname = usePathname();
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  React.useEffect(() => {
    setMenuState(false);
  }, [pathname]);

  return (
    <header suppressHydrationWarning>
      <nav
        aria-label="Primary navigation"
        data-state={menuState ? "active" : "inactive"}
        className="fixed z-20 w-full px-2"
        suppressHydrationWarning
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-7xl px-4 transition-all duration-300 sm:px-6 lg:px-10",
            isScrolled && "max-w-6xl rounded-2xl border bg-background/80 shadow-sm backdrop-blur-lg",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4 py-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6 lg:py-4">
            <div className="flex w-full items-center justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="GSoC Organizations Guide home"
                className="flex items-center gap-2 font-semibold tracking-tight"
              >
                <span className="text-lg sm:text-xl">GSoC Guide</span>
              </Link>

              <button
                type="button"
                onClick={() => setMenuState((open) => !open)}
                aria-expanded={menuState}
                aria-controls="primary-menu"
                aria-label={menuState ? "Close menu" : "Open menu"}
                className="relative z-20 -mr-2 block cursor-pointer rounded-lg p-2 hover:bg-muted lg:hidden"
              >
                {menuState ? <X className="size-6" /> : <Menu className="size-6" />}
              </button>
            </div>

            <div className="hidden min-w-0 lg:block">
              <ul className="flex flex-nowrap justify-center gap-3 text-sm xl:gap-6" aria-label="Site sections">
                {menuItems.map((item) => {
                  const active = isMenuItemActive(pathname, item.href);
                  return (
                    <li key={item.href} className="min-w-0">
                      <Link
                        href={item.href}
                        prefetch
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-1.5 whitespace-nowrap rounded-md px-1.5 py-1 transition-colors hover:text-primary",
                          active ? "font-semibold text-primary" : "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">{item.name}</span>
                        {item.badge ? (
                          <span className="hidden rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary xl:inline">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div
              id="primary-menu"
              className={cn(
                "w-full rounded-2xl border bg-background p-5 shadow-xl shadow-zinc-300/20 dark:shadow-none lg:flex lg:w-auto lg:shrink-0 lg:items-center lg:justify-end lg:gap-3 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none",
                menuState ? "block" : "hidden lg:block",
              )}
            >
              <ul className="space-y-2 border-b pb-4 text-base lg:hidden" aria-label="Mobile site sections">
                {menuItems.map((item) => {
                  const active = isMenuItemActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted",
                          active ? "font-semibold text-primary" : "text-muted-foreground",
                        )}
                      >
                        <span>{item.name}</span>
                        {item.badge ? (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-2 lg:mt-0 lg:flex-nowrap">
                <Button variant="outline" size="sm" asChild>
                  <a href={SOCIAL_LINKS.github.href} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LINKS.github.label}>
                    <GitHubIcon className="size-4" />
                    <span className="hidden xl:inline">GitHub</span>
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={SOCIAL_LINKS.twitter.href} target="_blank" rel="noopener noreferrer" aria-label={SOCIAL_LINKS.twitter.label}>
                    <XIcon className="size-4" />
                    <span className="hidden xl:inline">X</span>
                  </a>
                </Button>
                <ModeToggle />
                <AuthNav />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
