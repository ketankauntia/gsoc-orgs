import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeadingProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  variant?: "hero" | "section" | "subsection" | "small";
}

interface TextProps {
  children: ReactNode;
  className?: string;
  as?: "p" | "span" | "div";
  variant?: "body" | "lead" | "muted" | "small";
}

const headingVariants = {
  hero: "text-5xl md:text-7xl tracking-tighter font-regular",
  section: "text-3xl md:text-5xl tracking-tighter font-regular",
  subsection: "text-2xl md:text-3xl tracking-tighter font-medium",
  small: "text-xl md:text-2xl tracking-tight font-medium",
};

const textVariants = {
  body: "text-base leading-relaxed",
  lead: "text-lg md:text-xl leading-relaxed tracking-tight",
  muted: "text-base leading-relaxed text-muted-foreground",
  small: "text-sm leading-relaxed",
};

/**
 * Reusable Heading component with consistent typography styles
 */
export const Heading = ({
  children,
  className,
  as: Component = "h2",
  variant = "section",
}: HeadingProps) => {
  return (
    <Component className={cn(headingVariants[variant], className)}>
      {children}
    </Component>
  );
};

/**
 * Reusable Text component with consistent typography styles
 */
export const Text = ({
  children,
  className,
  as: Component = "p",
  variant = "body",
}: TextProps) => {
  return (
    <Component className={cn(textVariants[variant], className)}>
      {children}
    </Component>
  );
};

