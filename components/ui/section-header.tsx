import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import { Heading } from "./typography";
import { Text } from "./typography";

interface SectionHeaderProps {
  badge?: string;
  title: string | ReactNode;
  description?: string | ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  titleAs?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const alignmentClasses = {
  left: "text-left items-start",
  center: "text-center items-center",
  right: "text-right items-end",
};

/**
 * Reusable SectionHeader component for consistent section intros
 * Includes optional badge, title, and description
 */
export const SectionHeader = ({
  badge,
  title,
  description,
  align = "left",
  className,
  titleClassName,
  descriptionClassName,
  titleAs = "h2",
}: SectionHeaderProps) => {
  return (
    <div className={cn("flex flex-col gap-4", alignmentClasses[align], className)}>
      {badge && (
        <Badge variant="outline">{badge}</Badge>
      )}
      <div className="flex flex-col gap-2">
        <Heading as={titleAs} className={cn("max-w-xl", titleClassName)}>{title}</Heading>
        {description && (
          <Text
            variant="muted"
            className={cn("max-w-xl lg:max-w-lg", descriptionClassName)}
          >
            {description}
          </Text>
        )}
      </div>
    </div>
  );
};

