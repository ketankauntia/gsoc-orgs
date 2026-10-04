"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  IconArrowUpRight,
  IconBook2,
  IconCalendarEvent,
  IconChevronDown,
  IconCode,
  IconFileText,
  IconHash,
  IconHistory,
  IconLayoutGrid,
  IconMenu2,
  IconNotebook,
  IconUserCircle,
  IconX,
} from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const CURRENT_EDITION = "/yearly/google-summer-of-code-2026";

const explore = [
  { label: "GSoC 2026", detail: "This year's organizations and projects", href: CURRENT_EDITION, icon: IconCalendarEvent },
  { label: "Projects", detail: "Every accepted project since 2016", href: "/projects", icon: IconLayoutGrid },
  { label: "Technologies", detail: "Who uses Python, Rust, C++ and more", href: "/tech-stack", icon: IconCode },
  { label: "Topics", detail: "Machine learning, science, web and more", href: "/topics", icon: IconHash },
  { label: "Past editions", detail: "Each program year since 2016", href: "/yearly", icon: IconHistory },
];

const learn = [
  { label: "Proposals", detail: "Accepted proposals to learn from", href: "/proposals", icon: IconFileText },
  { label: "Contributor blogs", detail: "Progress blogs from past contributors", href: "/contributor-blogs", icon: IconNotebook },
  { label: "Blog", detail: "Guides for choosing and applying", href: "/blog", icon: IconBook2 },
];

function isActive(pathname: string, href: string) {
  if (href === "/yearly") return pathname.startsWith("/yearly") && pathname !== CURRENT_EDITION;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useCloseOnNavigate(setOpen: (open: boolean) => void) {
  const pathname = usePathname();
  const [last, setLast] = useState(pathname);
  if (pathname !== last) { setLast(pathname); setOpen(false); }
  return pathname;
}

function MenuLinks({ items, pathname }: { items: typeof explore; pathname: string }) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.href} href={item.href} className="cb-mega-link" aria-current={isActive(pathname, item.href) ? "page" : undefined}>
            <span className="cb-mega-icon" aria-hidden="true"><Icon size={16} stroke={1.75} /></span>
            <span className="cb-mega-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
          </Link>
        );
      })}
    </>
  );
}

/** Desktop primary navigation with the Explore and Learn menus. */
export function PrimaryNav() {
  const [open, setOpen] = useState<"explore" | "learn" | null>(null);
  const pathname = useCloseOnNavigate(() => setOpen(null));
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) { if (!ref.current?.contains(event.target as Node)) setOpen(null); }
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(null); }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey); };
  }, [open]);
  const exploreActive = explore.some((item) => isActive(pathname, item.href));
  const learnActive = learn.some((item) => isActive(pathname, item.href));
  return (
    <nav className="cb-nav" aria-label="Primary" ref={ref}>
      <Link href="/organizations" aria-current={isActive(pathname, "/organizations") ? "page" : undefined}>Organizations</Link>
      <div className="cb-popover-wrap">
        <button type="button" aria-expanded={open === "explore"} data-active={exploreActive || undefined} onClick={() => setOpen(open === "explore" ? null : "explore")}>
          Explore <IconChevronDown size={14} stroke={2} aria-hidden />
        </button>
        {open === "explore" ? <div className="cb-popover cb-mega" role="menu"><MenuLinks items={explore} pathname={pathname} /></div> : null}
      </div>
      <div className="cb-popover-wrap">
        <button type="button" aria-expanded={open === "learn"} data-active={learnActive || undefined} onClick={() => setOpen(open === "learn" ? null : "learn")}>
          Learn <IconChevronDown size={14} stroke={2} aria-hidden />
        </button>
        {open === "learn" ? <div className="cb-popover cb-mega" role="menu"><MenuLinks items={learn} pathname={pathname} /></div> : null}
      </div>
    </nav>
  );
}

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

/** Sign in / Account link (Supabase session in the browser). */
export function AuthLink() {
  const signedIn = useSignedIn();
  return (
    <Link href={signedIn ? "/account" : "/login"} className="cb-button cb-button-ink cb-auth-link">
      <IconUserCircle size={16} stroke={1.9} aria-hidden />
      {signedIn ? "Account" : "Sign in"}
    </Link>
  );
}

/** Full-screen menu for small screens. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = useCloseOnNavigate(setOpen);
  const signedIn = useSignedIn();
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <>
      <button type="button" className="cb-icon-button cb-menu-button" aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
        {open ? <IconX size={20} stroke={1.75} aria-hidden /> : <IconMenu2 size={20} stroke={1.75} aria-hidden />}
      </button>
      {open ? (
        <div className="cb-mobile-menu" role="dialog" aria-label="Menu">
          <Link href="/organizations" className="cb-mobile-primary" aria-current={isActive(pathname, "/organizations") ? "page" : undefined}>Organizations</Link>
          <p className="cb-mobile-title">Explore</p>
          <MenuLinks items={explore} pathname={pathname} />
          <p className="cb-mobile-title">Learn</p>
          <MenuLinks items={learn} pathname={pathname} />
          <div className="cb-mobile-foot">
            <Link href={signedIn ? "/account" : "/login"} className="cb-button cb-button-outline">
              <IconUserCircle size={16} stroke={1.75} aria-hidden /> {signedIn ? "Account" : "Sign in"}
            </Link>
            <a href="https://github.com/ketankauntia/gsoc-orgs/" target="_blank" rel="noreferrer noopener" className="cb-button cb-button-outline">
              GitHub <IconArrowUpRight size={14} stroke={2} aria-hidden />
            </a>
          </div>
        </div>
      ) : null}
    </>
  );
}
