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
 * Used as the main wrapper for page sections
 */
export const Section = ({
  children,
  className,
  containerClassName,
  fullWidth = false,
  noPadding = false,
}: SectionProps) => {
  return (
    <section className={cn("w-full", !noPadding && "py-20 lg:py-40", className)}>
      <div
        className={cn(
          !fullWidth && "mx-auto max-w-6xl px-6 lg:px-12",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
};

