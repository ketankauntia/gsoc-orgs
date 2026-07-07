/** Shared narrow shell for static pages (about, contact, legal). */
export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-content flex-1 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
      <div className="mt-6 space-y-4 leading-relaxed text-foreground/90 [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </main>
  );
}
