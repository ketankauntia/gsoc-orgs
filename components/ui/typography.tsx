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
  hero: "text-[clamp(3rem,8vw,7.5rem)] leading-[0.9] tracking-[-0.055em] font-medium text-balance",
  section: "text-[clamp(2.25rem,5vw,4.75rem)] leading-[0.98] tracking-[-0.045em] font-medium text-balance",
  subsection: "text-[clamp(1.75rem,3vw,3rem)] leading-[1.02] tracking-[-0.035em] font-medium text-balance",
  small: "text-xl md:text-2xl leading-tight tracking-[-0.025em] font-semibold text-balance",
};

const textVariants = {
  body: "text-base leading-relaxed",
  lead: "text-lg md:text-xl leading-[1.55] tracking-[-0.012em] text-pretty",
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
