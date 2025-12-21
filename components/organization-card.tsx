import Link from "next/link";
import { Organization } from "@/lib/api";

interface OrganizationCardProps {
  org: Organization;
  showYears?: boolean;
  showTechStack?: boolean;
  className?: string;
}

/**
 * Reusable Organization Card Component
 * Used across /organizations, /gsoc-YYYY-organizations, and other pages
 */
export function OrganizationCard({ 
  org, 
  showYears = true, 
  showTechStack = true,
  className = ""
}: OrganizationCardProps) {
  const logoUrl = org.img_r2_url || org.logo_r2_url;

  return (
    <Link 
      href={`/organizations/${org.slug}`}
      className={`block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all ${className}`}
    >
      {/* Header with Logo */}
      <div className="flex items-start gap-4 mb-3">
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${org.name} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-lg font-semibold text-gray-400">
              {org.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 text-base line-clamp-1 mb-0.5">
            {org.name}
          </h3>
          <p className="text-sm text-gray-500">
            {org.total_projects} projects
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-3 mb-4">
        {org.description}
      </p>

      {/* Years Section */}
      {showYears && org.active_years && org.active_years.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {org.active_years
              .sort((a, b) => b - a)
              .map((year) => (
                <span
                  key={year}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-teal-50 text-teal-700 rounded-md"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {year}
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Technologies Section */}
      {showTechStack && org.technologies && org.technologies.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Tech Stack</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {org.technologies.slice(0, 6).map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-md"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                {tech}
              </span>
            ))}
            {org.technologies.length > 6 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-white text-gray-600 border border-gray-200 rounded-md">
                +{org.technologies.length - 6} more
              </span>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}

