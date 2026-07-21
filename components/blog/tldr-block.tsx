import { IconInfoCircle } from "@tabler/icons-react";

/** Short reader-facing orientation shown before the main article. */
export function TldrBlock({ text }: { text: string }) {
  return (
    <aside
      aria-label="Article summary"
      className="rounded-xl border border-primary/25 bg-primary/5 p-5"
    >
      <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <IconInfoCircle className="size-4" />
        In brief
      </p>
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
    </aside>
  );
}
