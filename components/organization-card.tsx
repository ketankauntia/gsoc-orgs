import Link from "next/link";
import Image from "next/image";
import { Organization } from "@/lib/api";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface OrganizationCardProps {
  org: Organization;
  showYears?: boolean;
  showTechStack?: boolean;
  className?: string;
  /** Card display variant */
  variant?: "default" | "compact" | "horizontal";
}

/**
 * Reusable Organization Card Component
 * Used across /organizations, /gsoc-YYYY-organizations, and other pages
 * 
 * @example
 * // Default card
 * <OrganizationCard org={org} />
 * 
 * // Compact card (no tech stack)
 * <OrganizationCard org={org} variant="compact" />
 */
export function OrganizationCard({ 
  org, 
  showYears = true, 
  showTechStack = true,
  className = "",
  variant = "default"
}: OrganizationCardProps) {
  // Prefer R2 URLs (Cloudflare) over regular image_url
  const logoUrl = org.img_r2_url || org.logo_r2_url || org.image_url;

  // Variant-based props
  const isCompact = variant === "compact";
  const effectiveShowTechStack = isCompact ? false : showTechStack;

  return (
    <Link 
      href={`/organizations/${org.slug}`}
      prefetch={true}
      className={cn(
        "block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all",
        "w-full max-w-[380px] sm:max-w-[420px]",
        "dark:bg-card dark:border-border dark:hover:border-gray-600",
        className
      )}
    >
      {/* Header with Logo */}
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${org.name} logo`}
              width={48}
              height={48}
              className="w-full h-full object-contain"
              unoptimized={true}
              loading="lazy"
            />
          ) : (
            <span className="text-lg font-semibold text-gray-400 dark:text-muted-foreground">
              {org.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-foreground text-base line-clamp-1 mb-0.5">
            {org.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-muted-foreground">
            {org.total_projects} projects
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-muted-foreground line-clamp-3 mb-4">
        {org.description}
      </p>

      {/* Years Section */}
      {showYears && org.active_years && org.active_years.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {org.active_years
              .sort((a, b) => b - a)
              .map((year) => (
                <Badge key={year} variant="year" size="xs">
                  {year}
                </Badge>
              ))}
          </div>
        </div>
      )}

      {/* Technologies Section */}
      {effectiveShowTechStack && org.technologies && org.technologies.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 dark:text-muted-foreground mb-1.5">Tech Stack</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {org.technologies.slice(0, 6).map((tech) => (
              <Badge key={tech} variant="tech" size="xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {tech}
              </Badge>
            ))}
            {org.technologies.length > 6 && (
              <Badge variant="neutral" size="xs">
                +{org.technologies.length - 6} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
