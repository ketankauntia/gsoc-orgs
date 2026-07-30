import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageRailProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  as?: "section" | "div";
}

/** Large-page shell with quiet vertical rails and responsive gutters. */
export function PageRail({
  children,
  className,
  innerClassName,
  as: Component = "section",
}: PageRailProps) {
  return (
    <Component className={cn("px-3 sm:px-5", className)}>
      <div
        className={cn(
          "atlas-rail mx-auto w-full max-w-shell px-4 sm:px-6 lg:px-8",
          innerClassName,
        )}
      >
        {children}
      </div>
    </Component>
  );
}

