import { PageRail } from "@/components/ui/page-rail";

interface PageShellProps {
  title: string;
  children: React.ReactNode;
  eyebrow?: string;
  description?: string;
}

/** Shared Atlas reading shell for static pages such as contact and legal copy. */
export function PageShell({
  title,
  children,
  eyebrow = "GSoC Atlas",
  description,
}: PageShellProps) {
  return (
    <main className="flex-1 pb-20 pt-28">
      <PageRail as="div">
        <header className="atlas-corner-marks border-b border-border px-1 py-12 sm:py-16">
          <p className="font-data text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.75rem,6vw,5.5rem)] font-medium leading-[0.94] tracking-[-0.05em] text-balance">
            {title}
          </h1>
          {description ? (
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>

        <div className="grid py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,45rem)_minmax(0,1fr)] lg:py-16">
          <article className="space-y-5 leading-7 text-foreground/88 lg:col-start-2 [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-[-0.025em] [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_a]:font-medium [&_a]:text-accent-foreground [&_a]:underline [&_a]:decoration-primary [&_a]:decoration-2 [&_a]:underline-offset-4 [&_li]:pl-1">
            {children}
          </article>
        </div>
      </PageRail>
    </main>
  );
}
