import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  fullWidth?: boolean;
  noPadding?: boolean;
}

/**
 * Reusable Section component that provides consistent spacing and container width
 * Uses max-w-6xl for centered content with comfortable margins
 */
export const Section = ({
  children,
  className,
  containerClassName,
  fullWidth = false,
  noPadding = false,
}: SectionProps) => {
  return (
    <section className={cn("w-full", !noPadding && "py-16 lg:py-24", className)}>
      <div
        className={cn(
          !fullWidth && "mx-auto max-w-shell px-4 sm:px-6 lg:px-8",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
};
