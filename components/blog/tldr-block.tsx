import { IconSparkles } from "@tabler/icons-react";

/** Answer-first AI summary. Rendered near the top so LLMs and skimmers get the takeaway immediately. */
export function TldrBlock({ text }: { text: string }) {
  return (
    <aside
      aria-label="Article summary"
      className="rounded-xl border border-primary/25 bg-primary/5 p-5"
    >
      <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <IconSparkles className="size-4" />
        TL;DR
      </p>
      <p className="text-sm leading-relaxed text-foreground">{text}</p>
    </aside>
  );
}
