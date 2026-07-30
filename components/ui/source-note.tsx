import { Database, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceNoteProps {
  date: string;
  source?: string;
  className?: string;
  inverse?: boolean;
}

export function SourceNote({
  date,
  source = "GSoC public archive snapshot",
  className,
  inverse = false,
}: SourceNoteProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 font-data text-[11px]",
        inverse ? "text-[#aaa29d]" : "text-muted-foreground",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <Database aria-hidden="true" className="size-3.5" />
        {source}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <RefreshCw aria-hidden="true" className="size-3.5" />
        Snapshot {date}
      </span>
    </div>
  );
}

