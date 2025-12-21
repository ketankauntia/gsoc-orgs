"use client";

import { useState, useMemo } from "react";
import { Organization } from "@/lib/api";
import { OrganizationCard } from "@/components/organization-card";
import { Heading, Button, Grid, Text } from "@/components/ui";

interface AllOrganizationsSectionProps {
  organizations: Organization[];
  year: string;
}

export function AllOrganizationsSection({ organizations, year }: AllOrganizationsSectionProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Verify organizations are from the correct year
  // The API endpoint /api/v1/years/${year}/organizations should already filter by year
  // But we'll double-check to ensure data integrity
  const yearNum = parseInt(year, 10);
  const validOrgs = useMemo(() => {
    return organizations.filter((org) => {
      // Check if organization has data for this year
      // The API should already filter, but verify using active_years or year data
      if (org.active_years && Array.isArray(org.active_years)) {
        return org.active_years.includes(yearNum);
      }
      // Fallback: if active_years is not available, trust the API filtering
      // since the endpoint is year-specific
      return true;
    });
  }, [organizations, yearNum]);

  const displayedOrgs = showAll ? validOrgs : validOrgs.slice(0, 12);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Heading variant="subsection">
          All Organizations ({validOrgs.length})
        </Heading>
        <Text variant="muted" className="text-sm mt-1">
          Organizations that participated in GSoC {year}
        </Text>
      </div>

      <Grid cols={{ default: 1, md: 2, lg: 3 }} gap="lg">
        {displayedOrgs.map((org) => (
          <OrganizationCard key={org.slug} org={org} />
        ))}
      </Grid>

      {validOrgs.length > 12 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? "Show Less"
              : `Show More (${validOrgs.length - 12} more)`}
          </Button>
        </div>
      )}
    </div>
  );
}

