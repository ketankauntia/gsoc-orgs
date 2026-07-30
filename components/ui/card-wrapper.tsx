import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

/**
 * Reusable Card wrapper component with consistent styling
 * Provides border, rounded corners, and optional hover effects
 */
export const CardWrapper = ({
  children,
  className,
  hover = false,
  padding = "md",
}: CardWrapperProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-[0_1px_1px_rgb(23_22_21/0.04)]",
        paddingClasses[padding],
        hover &&
          "transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_10px_30px_rgb(23_22_21/0.08)] motion-reduce:transform-none",
        className
      )}
    >
      {children}
    </div>
  );
};
