import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MetricCellProps {
  value: ReactNode;
  label: ReactNode;
  note?: ReactNode;
  className?: string;
  inverse?: boolean;
}

/** A single evidence cell with stable tabular figures and an optional source note. */
export function MetricCell({
  value,
  label,
  note,
  className,
  inverse = false,
}: MetricCellProps) {
  return (
    <div
      className={cn(
        "flex min-h-32 flex-col justify-between gap-6 border-border p-5 sm:p-6",
        inverse && "border-white/15",
        className,
      )}
    >
      <div
        className={cn(
          "font-data text-[clamp(2rem,4vw,3.75rem)] font-medium leading-none tracking-[-0.055em]",
          inverse ? "text-[#f5eee9]" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="space-y-1">
        <p
          className={cn(
            "text-sm font-semibold",
            inverse ? "text-[#f5eee9]" : "text-foreground",
          )}
        >
          {label}
        </p>
        {note ? (
          <p
            className={cn(
              "font-data text-[11px] leading-relaxed",
              inverse ? "text-[#aaa29d]" : "text-muted-foreground",
            )}
          >
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}

