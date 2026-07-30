import { cn } from "@/lib/utils";

interface AtlasMarkProps {
  className?: string;
  title?: string;
}

/**
 * Original node-and-path mark for GSoC Atlas.
 * It represents an organization connected to projects and technologies.
 */
export function AtlasMark({ className, title }: AtlasMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("size-8", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M8 8.5 16 16m0 0 8-8m-8 8 8 7.5M16 16 8 23.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="8.5" r="3.25" fill="currentColor" />
      <circle cx="24" cy="8" r="2.25" fill="currentColor" opacity=".48" />
      <circle cx="24" cy="24" r="3.25" fill="currentColor" />
      <circle cx="8" cy="24" r="2.25" fill="currentColor" opacity=".48" />
      <circle cx="16" cy="16" r="3.25" fill="currentColor" />
    </svg>
  );
}

