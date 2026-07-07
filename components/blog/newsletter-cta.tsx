import { IconMail } from "@tabler/icons-react";
import { Button } from "@/components/blog-ui/button";
import { Input } from "@/components/blog-ui/input";
import { features } from "@/lib/features";

/** Newsletter capture. Static UI for now — wire to a form action when the backend exists. Toggle: features.newsletter. */
export function NewsletterCta() {
  if (!features.newsletter) return null;
  return (
    <aside
      aria-label="Newsletter signup"
      className="rounded-xl border border-primary/25 bg-primary/5 p-6 text-center sm:p-8"
    >
      <p className="font-heading text-lg font-semibold">Get GSoC insights in your inbox</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        One practical article on GSoC organizations, project discovery, and contributor prep.
        No spam, unsubscribe anytime.
      </p>
      <form className="mx-auto mt-4 flex max-w-sm gap-2">
        <Input type="email" required placeholder="you@company.com" aria-label="Email address" />
        <Button type="submit">
          <IconMail className="size-4" />
          Subscribe
        </Button>
      </form>
    </aside>
  );
}
