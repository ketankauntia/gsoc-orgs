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
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        paddingClasses[padding],
        hover && "transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
        className
      )}
    >
      {children}
    </div>
  );
};

