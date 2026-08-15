import Link from "next/link";
import { Section, Heading, Text } from "@/components/ui";
import { SocialLinks } from "@/components/social-links";
import { FOOTER_COPYRIGHT, FOOTER_NAVIGATION_ITEMS } from "@/components/footer-common";

export const Footer = () => (
  <footer>
    <Section className="bg-foreground text-background dark:bg-card dark:text-white">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className="flex flex-col items-start gap-7">
          <div className="flex flex-col gap-3">
            <Heading>GSoC Organizations Guide</Heading>
            <Text className="max-w-lg text-background/75 dark:text-white/75">
              Explore organizations, projects, proposals, and past editions to
              make your Google Summer of Code preparation more focused.
            </Text>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <Link href="/organizations" className="rounded-full border border-background/30 px-4 py-2 transition-colors hover:bg-background/10">Browse organizations</Link>
            <Link href="/proposals" className="rounded-full border border-background/30 px-4 py-2 transition-colors hover:bg-background/10">Read proposals</Link>
          </div>
          <SocialLinks showLabels className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm" linkClassName="transition-opacity hover:opacity-75" textColor="white" />
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FOOTER_NAVIGATION_ITEMS.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <div>
                <p className="font-semibold">{group.title}</p>
                <p className="mt-1 text-sm text-background/55 dark:text-white/55">{group.description}</p>
              </div>
              <nav aria-label={`${group.title} links`} className="flex flex-col gap-2 text-sm">
                {group.items.map((item) => item.external ? (
                  <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer" className="text-background/75 transition-colors hover:text-background dark:text-white/75 dark:hover:text-white">{item.title}</a>
                ) : (
                  <Link key={item.title} href={item.href} className="text-background/75 transition-colors hover:text-background dark:text-white/75 dark:hover:text-white">{item.title}</Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-background/15 pt-6 text-sm text-background/60 dark:text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© {FOOTER_COPYRIGHT.year}{" "}<Link href={FOOTER_COPYRIGHT.organizationUrl} className="hover:text-background dark:hover:text-white">{FOOTER_COPYRIGHT.organization}</Link>. {FOOTER_COPYRIGHT.text}.</p>
        <p>Not affiliated with Google.</p>
      </div>
    </Section>
  </footer>
);
