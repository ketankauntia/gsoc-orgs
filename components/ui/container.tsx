import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "default" | "small" | "large" | "full";
}

const sizeClasses = {
  default: "max-w-6xl",
  small: "max-w-4xl",
  large: "max-w-7xl",
  full: "max-w-full",
};

/**
 * Reusable Container component for consistent max-width and centering
 */
export const Container = ({
  children,
  className,
  size = "default",
}: ContainerProps) => {
  return (
    <div className={cn("mx-auto px-6 lg:px-12", sizeClasses[size], className)}>
      {children}
    </div>
  );
};

