import { GitHubIcon } from '@/components/icons'
import { Badge, Heading, Text } from "@/components/ui";
import { CHANGELOG_ENTRIES } from "@/lib/changelog-data";
import { Metadata } from "next";
import { Header } from "@/components/header";
import { FooterSmall } from "@/components/footer-small";
import { getFullUrl } from '@/lib/constants';


export const metadata: Metadata = {
  title: "Changelog | GSoC Orgs",
  description: "Stay up to date with the latest features, improvements, and fixes for GSoC Orgs.",
  alternates: {
    canonical: getFullUrl("/changelog"),
  },
};

export default function ChangelogPage() {

  const sortedEntries = [...CHANGELOG_ENTRIES].sort((a, b) => b.timeStamp - a.timeStamp);

  // Helper to parse [Text](URL) into Teal Links
  const formatChangelogText = (text: string) => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline text-chart-2 font-medium transition-colors"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto py-12 px-6">

        <header className="mb-16 mt-[60px] border-b border-border pb-8">
          <Heading className="text-3xl md:text-5xl tracking-tighter font-regular max-w-xl">Changelog</Heading>
          <Text className="text-base leading-relaxed text-muted-foreground max-w-xl lg:max-w-lg mt-4">The latest updates and improvements.</Text>
        </header>

        <div className="space-y-20 relative">
          {/* The Timeline Line */}
          <div className="absolute left-[11px] md:left-[155px] top-2 bottom-0 w-px bg-border hidden sm:block" />

          {sortedEntries.map((entry) => (
            <article key={entry.timeStamp} className="relative grid grid-cols-1 md:grid-cols-[140px_1fr] gap-8 md:gap-12 pb-16 border-b border-border last:border-0">

              {/* Left Column: Date & Version */}
              <div className="md:sticky md:top-24 h-fit">
                <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-1">
                  <time className="text-sm font-semibold text-foreground whitespace-nowrap">{entry.date}</time>
                  <Badge variant="secondary" className="text-[10px] font-bold bg-muted text-muted-foreground border-border uppercase">
                    {entry.version}
                  </Badge>
                </div>
                <div className="hidden md:flex flex-col items-end gap-2 mt-4">
                  {entry.prLinks.map((pr, i) => (
                    <a
                      key={i}
                      href={pr.link}
                      target="_blank"
                      rel='noopener noreferrer'
                      className="flex items-center gap-1.5 text-xs text-chart-2 hover:underline transition-colors group"
                    >
                      <GitHubIcon className="w-3 h-3" />
                      <span>{pr.number}</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Right Column: Content */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Heading className="text-2xl md:text-3xl font-medium">{entry.title}</Heading>
                  <Text className="text-muted-foreground leading-relaxed">{entry.summary}</Text>
                </div>

                <ul className="space-y-3">
                  {entry.changes.map((change, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-foreground" />
                      <span className="text-[15px] text-foreground/90">{formatChangelogText(change.text)}</span>
                    </li>
                  ))}
                </ul>

                {/* Mobile PR Link */}
                <div className="flex md:hidden flex-wrap gap-x-4 gap-y-2 pt-4 border-t border-border">
                  {entry.prLinks.map((pr, i) => (
                    <a
                      key={i}
                      href={pr.link}
                      className="flex items-center gap-2 text-sm text-chart-2 font-medium"
                    >
                      <GitHubIcon className="w-4 h-4" />
                      {pr.number}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
      <FooterSmall />
    </>
  );
}