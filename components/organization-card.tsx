import Link from "next/link";
import { ArrowRight, CalendarRange, FolderGit2 } from "lucide-react";
import type { Organization } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { OrganizationLogo } from "@/components/organization-logo";
import { cn } from "@/lib/utils";

interface OrganizationCardProps {
  org: Organization;
  showYears?: boolean;
  showTechStack?: boolean;
  className?: string;
  variant?: "default" | "compact" | "horizontal";
}

export function OrganizationCard({
  org,
  showYears = true,
  showTechStack = true,
  className,
  variant = "default",
}: OrganizationCardProps) {
  const logoUrl = org.img_r2_url || org.logo_r2_url || org.image_url;
  const technologies = org.technologies ?? [];
  const years = [...(org.active_years ?? [])].sort((a, b) => b - a);
  const participationCount = years.length;
  const isCompact = variant === "compact";

  return (
    <Link
      href={`/organizations/${org.slug}`}
      prefetch
      className={cn(
        "group flex min-h-[21rem] w-full min-w-0 flex-col rounded-xl border border-border bg-card p-5 shadow-[0_1px_1px_rgb(23_22_21/0.04)] transition-[border-color,box-shadow,transform] duration-[180ms] hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-[0_12px_30px_rgb(23_22_21/0.08)] motion-reduce:transform-none",
        variant === "horizontal" &&
          "min-h-0 sm:grid sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <OrganizationLogo name={org.name} src={logoUrl} size={48} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="line-clamp-2 text-base font-semibold leading-5 tracking-[-0.02em]">
              {org.name}
            </h3>
            {org.is_currently_active ? (
              <span
                className="size-2 shrink-0 rounded-full bg-success"
                title="Active in the latest dataset snapshot"
                aria-label="Active in the latest dataset snapshot"
              />
            ) : null}
          </div>
          <p className="mt-1 font-data text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Latest record · {org.last_year || "Unknown"}
          </p>
        </div>
      </div>

      <div className={cn("mt-6 flex-1", variant === "horizontal" && "sm:mt-0")}>
        <p className="line-clamp-3 text-sm leading-6 text-foreground/78">
          {org.description || "Organization profile and historical project data."}
        </p>

        {!isCompact && org.category ? (
          <Badge variant="category" size="xs" className="mt-4 max-w-full truncate">
            {org.category}
          </Badge>
        ) : null}

        {showTechStack && !isCompact && technologies.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {technologies.slice(0, 3).map((technology) => (
              <Badge key={technology} variant="tech" size="xs">
                {technology}
              </Badge>
            ))}
            {technologies.length > 3 ? (
              <Badge variant="neutral" size="xs">
                +{technologies.length - 3}
              </Badge>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-6 flex items-end justify-between gap-4 border-t border-border pt-4",
          variant === "horizontal" &&
            "sm:mt-0 sm:min-w-44 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0",
        )}
      >
        <div className="flex gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 text-xs">
            <FolderGit2 className="size-3.5" strokeWidth={1.6} />
            {org.total_projects} projects
          </span>
          {showYears ? (
            <span className="inline-flex items-center gap-1.5 text-xs">
              <CalendarRange className="size-3.5" strokeWidth={1.6} />
              {participationCount} {participationCount === 1 ? "year" : "years"}
            </span>
          ) : null}
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-[background-color,border-color,color] duration-[180ms] group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
          <ArrowRight className="size-4" strokeWidth={1.7} />
        </span>
      </div>
    </Link>
  );
}

