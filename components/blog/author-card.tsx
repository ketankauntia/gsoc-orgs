import { IconBrandLinkedin, IconBrandX, IconWorld } from "@tabler/icons-react";
import { Avatar, AvatarFallback } from "@/components/blog-ui/avatar";
import { Button } from "@/components/blog-ui/button";
import type { Author } from "@/lib/blog/types";

/**
 * Full author block shown after the article body (E-E-A-T signal).
 * Outbound author links are rel="nofollow" unless author.followLinks is true.
 * Pass profileHref to link the name to the author page.
 */
export function AuthorCard({ author, profileHref }: { author: Author; profileHref?: string }) {
  const rel = author.followLinks ? "noreferrer" : "nofollow noreferrer";
  const links = [
    { url: author.websiteUrl, label: `${author.name}'s website`, Icon: IconWorld },
    { url: author.linkedinUrl, label: `${author.name} on LinkedIn`, Icon: IconBrandLinkedin },
    { url: author.twitterUrl, label: `${author.name} on X`, Icon: IconBrandX },
  ].filter((l): l is { url: string; label: string; Icon: typeof IconWorld } => Boolean(l.url));

  return (
    <aside aria-label="About the author" className="flex gap-4 rounded-xl border bg-card p-5">
      <Avatar className="size-12">
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {author.initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-heading font-semibold">
          {profileHref ? (
            <a href={profileHref} className="hover:underline">
              {author.name}
            </a>
          ) : (
            author.name
          )}
        </p>
        <p className="text-sm text-muted-foreground">{author.role}</p>
        <p className="mt-2 text-sm text-muted-foreground">{author.bio}</p>
        {links.length > 0 && (
          <div className="mt-2 flex gap-1">
            {links.map(({ url, label, Icon }) => (
              <Button key={label} variant="ghost" size="icon" asChild aria-label={label}>
                <a href={url} target="_blank" rel={rel}>
                  <Icon className="size-4" />
                </a>
              </Button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
