import { IconListCheck } from "@tabler/icons-react";

export function KeyTakeaways({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <aside aria-label="Key takeaways" className="rounded-xl border bg-card p-5">
      <p className="mb-3 inline-flex items-center gap-1.5 text-sm font-semibold">
        <IconListCheck className="size-4 text-primary" />
        Key takeaways
      </p>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
