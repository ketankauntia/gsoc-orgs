import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "default" | "small" | "large" | "full";
}

const sizeClasses = {
  default: "max-w-shell",
  small: "max-w-content",
  large: "max-w-[90rem]",
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
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8", sizeClasses[size], className)}>
      {children}
    </div>
  );
};
