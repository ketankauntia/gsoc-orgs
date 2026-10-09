import Image from "next/image";
import Link from "next/link";
import { IconArrowUpRight, IconBrandFacebook, IconBrandGithub, IconBrandLinkedin, IconBrandPinterest, IconBrandX } from "@tabler/icons-react";
import { FOOTER_NAVIGATION_ITEMS, SOCIAL_LINKS } from "@/components/footer-common";
import { ShortlistMenu } from "./controls";
import { searchIndex } from "./data";
import { AuthLink, MobileMenu, PrimaryNav } from "./nav";
import { CobaltShell, SearchButton, ThemeToggle } from "./shell";

function Brand() {
  return (
    <Link href="/" className="cb-brand" aria-label="GSoC Organizations Guide home">
      <Image className="cb-brand-mark" src="/gsoc-org-logo-mark.webp" alt="" width={30} height={30} priority />
      <span className="cb-brand-name">GSoC Organizations <small>/ Guide</small></span>
    </Link>
  );
}

function Header() {
  return (
    <header className="cb-header">
      <a href="#cb-main" className="cb-skip">Skip to content</a>
      <div className="cb-page cb-header-inner">
        <Brand />
        <PrimaryNav />
        <div className="cb-header-actions">
          <SearchButton />
          <ThemeToggle />
          <ShortlistMenu />
          <AuthLink />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

const SOCIALS = [
  { ...SOCIAL_LINKS.github, icon: IconBrandGithub },
  { ...SOCIAL_LINKS.twitter, icon: IconBrandX },
  { ...SOCIAL_LINKS.linkedin, icon: IconBrandLinkedin },
  { ...SOCIAL_LINKS.facebook, icon: IconBrandFacebook },
  { ...SOCIAL_LINKS.pinterest, icon: IconBrandPinterest },
];

function Footer() {
  return (
    <footer className="cb-footer">
      <div className="cb-page cb-footer-grid">
        <div className="cb-footer-brand">
          <Brand />
          <p>An independent, open source guide to every Google Summer of Code organization since 2016, built from Google&apos;s public program archive.</p>
          <div className="cb-socials">
            {SOCIALS.map((social) => {
              const Icon = social.icon;
              return <a key={social.href} href={social.href} target="_blank" rel="noreferrer noopener" className="cb-icon-button cb-icon-button-bordered" aria-label={social.label} title={social.label}><Icon size={16} stroke={1.75} aria-hidden /></a>;
            })}
          </div>
        </div>
        {FOOTER_NAVIGATION_ITEMS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <p>{group.title}</p>
            {group.items.map((item) => ("external" in item && item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer noopener">{item.title} <IconArrowUpRight size={12} stroke={2} aria-hidden /></a>
            ) : (
              <Link key={item.href} href={item.href}>{item.title}</Link>
            )))}
          </nav>
        ))}
      </div>
      <div className="cb-page cb-footer-legal">
        <p>© {new Date().getFullYear()} GSoC Organizations Guide. Independent guide, not affiliated with Google.</p>
      </div>
    </footer>
  );
}

/** Site chrome for every route: tokens root, shell (search, tooltip), header and footer. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="cb">
      <CobaltShell index={searchIndex()}>
        <Header />
        <div id="cb-main" className="cb-main">{children}</div>
        <Footer />
      </CobaltShell>
    </div>
  );
}
