"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Section, Heading } from "@/components/ui";
import type { FeaturedOrg } from "@/lib/homepage-types";

interface TrendingOrgsProps {
  organizations: FeaturedOrg[];
}

interface OrgCardProps {
  org: FeaturedOrg;
  index: number;
}

function OrgCard({ org, index }: OrgCardProps) {
  return (
    <a
      href={`/organizations/${org.slug}`}
      key={`${org.id}-${index}`}
      className="group shrink-0"
      aria-label={`View ${org.name} details`}
    >
      <div className="relative flex w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm items-center justify-center p-4 transition-all duration-300 group-hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] group-hover:-translate-y-1.5 group-hover:border-blue-200 dark:group-hover:border-blue-900">
        {/* Subtle hover glow bg */}
        <div className="absolute inset-0 rounded-2xl bg-blue-50 dark:bg-blue-950/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        {org.img_r2_url ? (
          <Image
            src={org.img_r2_url}
            alt={org.name}
            width={100}
            height={100}
            className="relative z-10 w-full h-full object-contain transition-all duration-300 group-hover:scale-110"
            unoptimized={true}
            loading="lazy"
          />
        ) : (
          <span className="relative z-10 text-3xl md:text-4xl font-extrabold text-zinc-300 dark:text-zinc-700 transition-colors group-hover:text-blue-500">
            {org.name.charAt(0)}
          </span>
        )}
      </div>
    </a>
  );
}

/**
 * TrendingOrgs Client Component
 *
 * Dual-track staggered infinite marquee.
 * Row 1 scrolls left, Row 2 scrolls right — creating a beautiful staggered effect.
 */
export function TrendingOrgsClient({ organizations }: TrendingOrgsProps) {
  if (organizations.length === 0) {
    return null;
  }

  // Split orgs into two halves for the two rows
  const half = Math.ceil(organizations.length / 2);
  const row1 = organizations.slice(0, half);
  const row2 = organizations.slice(half);

  // Triple each row for a seamless infinite loop
  const marqueeRow1 = [...row1, ...row1, ...row1];
  const marqueeRow2 = [...row2, ...row2, ...row2];

  return (
    <Section noPadding className="py-16 md:py-28 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="container mx-auto px-4 md:px-6 mb-12 text-center">
        <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/50 dark:text-blue-400 mb-4">
          Community
        </div>
        <Heading as="h2" className="text-3xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Trending GSoC Organizations
        </Heading>
        <p className="mt-3 text-lg text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
          Discover the most active open-source communities contributing to GSoC right now.
        </p>
      </div>

      {/* Marquee Rows */}
      <div className="flex flex-col gap-5 md:gap-7">
        {/* Row 1 — scrolls LEFT */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 md:w-56 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 md:w-56 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
          <motion.div
            className="flex gap-5 md:gap-7 w-max pr-5 md:pr-7"
            animate={{ x: ["0%", "-33.333333%"] }}
            transition={{ ease: "linear", duration: 45, repeat: Infinity }}
          >
            {marqueeRow1.map((org, index) => (
              <OrgCard key={`row1-${org.id}-${index}`} org={org} index={index} />
            ))}
          </motion.div>
        </div>

        {/* Row 2 — scrolls RIGHT (opposite direction) */}
        <div className="relative w-full overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 md:w-56 bg-gradient-to-r from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 md:w-56 bg-gradient-to-l from-white dark:from-zinc-950 to-transparent z-10 pointer-events-none" />
          <motion.div
            className="flex gap-5 md:gap-7 w-max pr-5 md:pr-7"
            animate={{ x: ["-33.333333%", "0%"] }}
            transition={{ ease: "linear", duration: 45, repeat: Infinity }}
          >
            {marqueeRow2.map((org, index) => (
              <OrgCard key={`row2-${org.id}-${index}`} org={org} index={index} />
            ))}
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
