"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { IconAlertTriangle, IconCheck, IconChevronDown, IconCircleCheck, IconRefresh, IconSearch, IconSend } from "@tabler/icons-react";
import "../community.css";

/* ------------------------------------------------------------------ */
/* Filter menu: a popover of links, searchable when the list is long. */

export interface MenuOption { label: string; href: string; active: boolean; hint?: string; keywords?: string }

/** Exact, then prefix, then word start, then substring, then hint/keywords. */
function rank(option: MenuOption, query: string) {
  const label = option.label.toLocaleLowerCase("en");
  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (new RegExp(`\\b${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(label)) return 2;
  if (label.includes(query)) return 3;
  return `${option.hint ?? ""} ${option.keywords ?? ""}`.toLocaleLowerCase("en").includes(query) ? 4 : -1;
}

const VISIBLE = 60;

export function FilterMenu({ label, anyLabel, anyHref, options, searchPlaceholder, note }: {
  label: string;
  anyLabel: string;
  anyHref: string;
  options: MenuOption[];
  searchPlaceholder?: string;
  note?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) { setLastPath(pathname); setOpen(false); }

  const selected = options.find((option) => option.active);
  const searchable = options.length > 10;
  const q = query.trim().toLocaleLowerCase("en");
  const matches = q
    ? options.map((option) => ({ option, score: rank(option, q) })).filter((entry) => entry.score >= 0).sort((a, b) => a.score - b.score || a.option.label.localeCompare(b.option.label)).map((entry) => entry.option)
    : options;
  const visible = matches.slice(0, VISIBLE);

  useEffect(() => {
    if (!open) return;
    (searchable ? inputRef.current : listRef.current?.querySelector<HTMLElement>("a"))?.focus();
    function onPointer(event: PointerEvent) { if (!ref.current?.contains(event.target as Node)) close(); }
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") close(); }
    window.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey); };
  }, [open, searchable]);

  function close() { setOpen(false); setQuery(""); }

  function onListKey(event: React.KeyboardEvent) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const links = [...(listRef.current?.querySelectorAll<HTMLElement>("a") ?? [])];
    if (!links.length) return;
    const at = links.indexOf(document.activeElement as HTMLElement);
    if (at === -1) { links[event.key === "ArrowDown" ? 0 : links.length - 1].focus(); return; }
    if (event.key === "ArrowUp" && at === 0 && searchable) { inputRef.current?.focus(); return; }
    links[(at + (event.key === "ArrowDown" ? 1 : -1) + links.length) % links.length].focus();
  }

  return (
    <div className="cb-popover-wrap cb-cm-filter" ref={ref}>
      <button type="button" className="cb-cm-filter-trigger" data-set={selected ? true : undefined} aria-haspopup="true" aria-expanded={open} aria-controls={open ? `${id}-menu` : undefined} onClick={() => (open ? close() : setOpen(true))}>
        <span className="cb-cm-filter-label">{label}</span>
        <span className="cb-cm-filter-value cb-truncate">{selected?.label ?? anyLabel}</span>
        <IconChevronDown size={15} stroke={2} aria-hidden />
      </button>
      {open ? (
        <div className="cb-popover cb-menu cb-cm-filter-pop" id={`${id}-menu`} onKeyDown={onListKey}>
          {searchable ? (
            <label className="cb-cm-filter-search">
              <IconSearch size={15} stroke={1.75} aria-hidden />
              <span className="cb-sr-only">Search {label.toLocaleLowerCase("en")}</span>
              <input ref={inputRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder ?? `Search ${options.length} options`} autoComplete="off" spellCheck={false} />
            </label>
          ) : null}
          <div className="cb-cm-filter-list cb-scroll-autohide" ref={listRef} role="menu" aria-label={label}>
            {!q ? (
              <Link href={anyHref} role="menuitemradio" aria-checked={!selected} scroll={false} onClick={close}>
                <span>{anyLabel}</span>
                {!selected ? <IconCheck size={16} stroke={2.25} aria-hidden /> : null}
              </Link>
            ) : null}
            {visible.map((option) => (
              <Link key={option.href} href={option.href} role="menuitemradio" aria-checked={option.active} scroll={false} onClick={close}>
                <span className="cb-cm-filter-option">
                  <span className="cb-truncate">{option.label}</span>
                  {option.hint ? <small>{option.hint}</small> : null}
                </span>
                {option.active ? <IconCheck size={16} stroke={2.25} aria-hidden /> : null}
              </Link>
            ))}
            {!visible.length ? <p className="cb-cm-filter-none">No {label.toLocaleLowerCase("en")} matches “{query}”.</p> : null}
          </div>
          {matches.length > visible.length ? <p className="cb-cm-filter-more">Showing {visible.length} of {matches.length}. Type to narrow the list.</p> : null}
          {note ? <p className="cb-cm-filter-more">{note}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contact form: opens the visitor's mail app with the message filled. */

const CONTACT_EMAIL = "gsocorganizationsguide@gmail.com";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const limit = 2000;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      const subject = encodeURIComponent(form.subject);
      const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\nMessage:\n${form.message}`);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSent(false), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSending(false);
    }
  }

  function onChange(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  if (sent) {
    return (
      <div className="cb-cm-sent" role="status">
        <span className="cb-empty-icon" aria-hidden="true"><IconCircleCheck size={22} stroke={1.75} /></span>
        <h3>Your mail app should be open</h3>
        <p>Send the drafted email from there. If nothing opened, write to <a className="cb-inline-link" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</p>
      </div>
    );
  }

  return (
    <form className="cb-cm-form" onSubmit={onSubmit}>
      <div className="cb-cm-form-row">
        <label className="cb-cm-field">
          <span>Name</span>
          <input name="name" type="text" required maxLength={120} autoComplete="name" value={form.name} onChange={onChange} placeholder="Your name" />
        </label>
        <label className="cb-cm-field">
          <span>Email</span>
          <input name="email" type="email" required maxLength={200} autoComplete="email" value={form.email} onChange={onChange} placeholder="you@example.com" />
        </label>
      </div>
      <label className="cb-cm-field">
        <span>Subject</span>
        <input name="subject" type="text" required maxLength={150} value={form.subject} onChange={onChange} placeholder="A correction to an organization page" />
      </label>
      <label className="cb-cm-field">
        <span>Message <small>{form.message.length}/{limit}</small></span>
        <textarea name="message" required rows={7} maxLength={limit} value={form.message} onChange={onChange} placeholder="What should we know?" />
      </label>
      <div className="cb-cm-form-foot">
        <p>Sending opens your email app with this message filled in.</p>
        <button type="submit" className="cb-button cb-button-ink" disabled={sending}>
          <IconSend size={16} stroke={1.75} aria-hidden />
          {sending ? "Opening mail app" : "Send message"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Admin sub-navigation as segmented links.                            */

export function AdminNav({ links }: { links: Array<{ label: string; href: string }> }) {
  const pathname = usePathname();
  return (
    <nav className="cb-segmented cb-cm-admin-nav" aria-label="Moderation">
      {links.map((link) => (
        <Link key={link.href} href={link.href} aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}>{link.label}</Link>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Route error boundary.                                               */

export function ErrorView({ digest, reset }: { digest?: string; reset: () => void }) {
  return (
    <main>
      <section className="cb-hero cb-not-found">
        <div className="cb-hero-grid" aria-hidden="true" />
        <div className="cb-page">
          <div className="cb-hero-copy cb-cm-error">
            <span className="cb-empty-icon" aria-hidden="true"><IconAlertTriangle size={22} stroke={1.75} /></span>
            <p className="cb-eyebrow">SOMETHING WENT WRONG</p>
            <h1>This page did not load. <span className="cb-serif">Try once more.</span></h1>
            <p className="cb-hero-lede">A request failed while the page was being built. Retrying usually works. If it keeps failing, the organization directory is a good place to continue.</p>
            <div className="cb-cm-actions">
              <button type="button" className="cb-button cb-button-ink cb-button-lg" onClick={reset}><IconRefresh size={17} stroke={2} aria-hidden />Try again</button>
              <Link href="/organizations" className="cb-button cb-button-outline cb-button-lg">Browse organizations</Link>
              <Link href="/" className="cb-button cb-button-outline cb-button-lg">Home</Link>
            </div>
            {digest ? <p className="cb-cm-digest">Reference {digest}</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
