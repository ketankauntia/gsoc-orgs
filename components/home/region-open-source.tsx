import Link from "next/link";
import {
  ArrowUpRight,
  CalendarRange,
  Code2,
  FileSearch,
} from "lucide-react";

import { PageRail } from "@/components/ui/page-rail";
import { SourceNote } from "@/components/ui/source-note";

export interface RegionOpenSourceProps {
  totalOrganizations: number;
  activeOrganizations: number;
  totalProjects: number;
  snapshotDate: string;
}

interface Capability {
  title: string;
  description: string;
  action: string;
  href: string;
  icon: typeof CalendarRange;
}

const capabilities: Capability[] = [
  {
    title: "Browse every angle",
    description:
      "Start with an organization, a technology, a topic, or a program year and keep the surrounding context in view.",
    action: "Explore organizations",
    href: "/organizations",
    icon: FileSearch,
  },
  {
    title: "Trace participation",
    description:
      "Compare annual snapshots to see when organizations appeared and how their recorded project activity changed.",
    action: "Explore yearly data",
    href: "/yearly",
    icon: CalendarRange,
  },
  {
    title: "Follow the evidence",
    description:
      "Move from a recorded stack to the organizations and completed project records connected to it.",
    action: "Browse technologies",
    href: "/tech-stack",
    icon: Code2,
  },
];

const numberFormatter = new Intl.NumberFormat("en-US");

function formatMetric(value: number) {
  return Number.isFinite(value) ? numberFormatter.format(value) : "\u2014";
}

function ArchiveMap({
  totalOrganizations,
  activeOrganizations,
  totalProjects,
}: Omit<RegionOpenSourceProps, "snapshotDate">) {
  const organizationCount = formatMetric(totalOrganizations);
  const activeCount = formatMetric(activeOrganizations);
  const projectCount = formatMetric(totalProjects);

  return (
    <svg
      aria-labelledby="region-open-source-map-title region-open-source-map-description"
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      viewBox="0 0 1000 560"
    >
      <title id="region-open-source-map-title">
        GSoC Atlas open source relationship map
      </title>
      <desc id="region-open-source-map-description">
        An abstract map connects {organizationCount} indexed organizations,{" "}
        {activeCount} organizations in the latest snapshot, and {projectCount}{" "}
        historical project records to yearly and technology views.
      </desc>

      <defs>
        <radialGradient id="archive-glow" cx="50%" cy="52%" r="48%">
          <stop offset="0%" stopColor="#ff5e1f" stopOpacity="0.22" />
          <stop offset="58%" stopColor="#ffb08f" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id="archive-node-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="12"
            floodColor="#242424"
            floodOpacity="0.08"
            stdDeviation="12"
          />
        </filter>
      </defs>

      <ellipse cx="500" cy="286" fill="url(#archive-glow)" rx="420" ry="238" />

      <g fill="none" stroke="#dedbd5" strokeWidth="1.25">
        <ellipse cx="500" cy="276" rx="418" ry="206" />
        <ellipse
          cx="500"
          cy="276"
          opacity="0.75"
          rx="338"
          ry="156"
          strokeDasharray="5 10"
        />
        <path d="M90 274C223 117 394 104 500 276C610 449 791 424 914 269" />
        <path d="M118 384C254 470 382 409 500 276C632 127 774 100 895 192" />
        <path d="M206 122C313 222 381 279 500 276C626 273 718 336 805 448" />
        <path d="M263 459C348 358 409 305 500 276C595 246 681 195 758 105" />
      </g>

      <g fill="#ff5e1f">
        <circle cx="114" cy="280" r="3.5" />
        <circle cx="177" cy="170" r="3.5" />
        <circle cx="232" cy="398" r="3.5" />
        <circle cx="334" cy="111" r="3.5" />
        <circle cx="365" cy="451" r="3.5" />
        <circle cx="632" cy="102" r="3.5" />
        <circle cx="693" cy="451" r="3.5" />
        <circle cx="823" cy="161" r="3.5" />
        <circle cx="891" cy="330" r="3.5" />
      </g>

      <g filter="url(#archive-node-shadow)">
        <circle
          cx="500"
          cy="276"
          fill="#ff5e1f"
          r="66"
          stroke="#242424"
          strokeWidth="1.5"
        />
        <circle
          cx="500"
          cy="276"
          fill="none"
          opacity="0.38"
          r="81"
          stroke="#ff5e1f"
          strokeWidth="2"
        />
        <text
          fill="#242424"
          fontFamily="var(--font-mono)"
          fontSize="12"
          fontWeight="650"
          letterSpacing="2.2"
          textAnchor="middle"
          x="500"
          y="269"
        >
          GSOC
        </text>
        <text
          fill="#242424"
          fontFamily="var(--font-mono)"
          fontSize="12"
          fontWeight="650"
          letterSpacing="2.2"
          textAnchor="middle"
          x="500"
          y="289"
        >
          ATLAS
        </text>
      </g>

      <g filter="url(#archive-node-shadow)">
        <circle cx="215" cy="206" fill="#ffffff" r="31" stroke="#242424" />
        <circle cx="215" cy="206" fill="#ff5e1f" r="7" />
        <rect
          fill="#ffffff"
          height="42"
          rx="8"
          stroke="#dedbd5"
          width="174"
          x="116"
          y="244"
        />
        <text
          fill="#8a847d"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.25"
          x="130"
          y="260"
        >
          ORGANIZATIONS
        </text>
        <text
          fill="#242424"
          fontFamily="var(--font-sans)"
          fontSize="14"
          fontWeight="600"
          x="130"
          y="278"
        >
          {organizationCount} indexed
        </text>
      </g>

      <g filter="url(#archive-node-shadow)">
        <circle cx="776" cy="198" fill="#ffffff" r="31" stroke="#242424" />
        <circle cx="776" cy="198" fill="#ff5e1f" r="7" />
        <rect
          fill="#ffffff"
          height="42"
          rx="8"
          stroke="#dedbd5"
          width="168"
          x="700"
          y="236"
        />
        <text
          fill="#8a847d"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.25"
          x="714"
          y="252"
        >
          LATEST SNAPSHOT
        </text>
        <text
          fill="#242424"
          fontFamily="var(--font-sans)"
          fontSize="14"
          fontWeight="600"
          x="714"
          y="270"
        >
          {activeCount} active
        </text>
      </g>

      <g filter="url(#archive-node-shadow)">
        <circle cx="498" cy="100" fill="#ffffff" r="27" stroke="#242424" />
        <circle cx="498" cy="100" fill="#ff5e1f" r="6" />
        <rect
          fill="#ffffff"
          height="42"
          rx="8"
          stroke="#dedbd5"
          width="172"
          x="412"
          y="132"
        />
        <text
          fill="#8a847d"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.25"
          x="426"
          y="148"
        >
          PROJECT RECORDS
        </text>
        <text
          fill="#242424"
          fontFamily="var(--font-sans)"
          fontSize="14"
          fontWeight="600"
          x="426"
          y="166"
        >
          {projectCount} mapped
        </text>
      </g>

      <g filter="url(#archive-node-shadow)">
        <circle cx="330" cy="402" fill="#ffffff" r="27" stroke="#242424" />
        <circle cx="330" cy="402" fill="#ff5e1f" r="6" />
        <text
          fill="#716c66"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.25"
          textAnchor="middle"
          x="330"
          y="447"
        >
          YEARS
        </text>
      </g>

      <g filter="url(#archive-node-shadow)">
        <circle cx="674" cy="397" fill="#ffffff" r="27" stroke="#242424" />
        <circle cx="674" cy="397" fill="#ff5e1f" r="6" />
        <text
          fill="#716c66"
          fontFamily="var(--font-mono)"
          fontSize="9"
          letterSpacing="1.25"
          textAnchor="middle"
          x="674"
          y="442"
        >
          TECHNOLOGY
        </text>
      </g>
    </svg>
  );
}

export function RegionOpenSource({
  totalOrganizations,
  activeOrganizations,
  totalProjects,
  snapshotDate,
}: RegionOpenSourceProps) {
  const organizationCount = formatMetric(totalOrganizations);

  return (
    <PageRail
      as="div"
      className="bg-white"
      innerClassName="pb-0 pt-24 lg:pt-32"
    >
      <section aria-labelledby="region-open-source-heading">
        <header className="mx-auto max-w-3xl text-center">
          <h2
            className="text-balance text-[clamp(2.75rem,6vw,5.3rem)] font-semibold leading-[0.91] tracking-[-0.06em]"
            id="region-open-source-heading"
          >
            Region: Open Source
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-[#77716b] sm:text-lg">
            GSoC is not one place. Across {organizationCount} indexed
            organizations, the atlas connects participation history to
            projects, technologies, topics, and source links.
          </p>
          <SourceNote
            className="mx-auto mt-6 w-fit"
            date={snapshotDate}
            source="GSoC Atlas public archive"
          />
        </header>

        <figure className="relative mt-12 overflow-hidden border-x border-t border-[#e4e1dc] bg-white sm:mt-16">
          <div
            aria-hidden="true"
            className="absolute inset-x-[8%] bottom-0 h-56 rounded-full bg-[#fff0e8] opacity-70 blur-[70px]"
          />
          <div className="relative h-[27rem] sm:h-[35rem] lg:h-[42rem]">
            <ArchiveMap
              activeOrganizations={activeOrganizations}
              totalOrganizations={totalOrganizations}
              totalProjects={totalProjects}
            />
          </div>
          <figcaption className="relative flex flex-col gap-2 border-t border-dashed border-[#dedbd5] bg-white px-5 py-4 font-data text-[10px] leading-5 text-[#77716b] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Relationship map, not geography. Lines connect archive
              dimensions, not people or real-time activity.
            </span>
            <span className="shrink-0">Snapshot {snapshotDate}</span>
          </figcaption>
        </figure>

        <div className="grid border-l border-t border-[#e4e1dc] md:grid-cols-3">
          {capabilities.map((capability) => {
            const Icon = capability.icon;

            return (
              <Link
                className="group flex min-h-[16rem] flex-col justify-between border-b border-r border-[#e4e1dc] bg-white p-6 outline-none transition-[background-color] duration-[180ms] hover:bg-[#faf9f7] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-[#ff5e1f] focus-visible:ring-inset sm:p-8"
                href={capability.href}
                key={capability.href}
              >
                <div className="flex items-start justify-between gap-4">
                  <Icon
                    aria-hidden="true"
                    className="size-6 text-[#ff5e1f]"
                    strokeWidth={1.55}
                  />
                  <ArrowUpRight
                    aria-hidden="true"
                    className="size-5 text-[#a39d96] transition-[color,transform] duration-[180ms] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#242424] motion-reduce:transform-none"
                    strokeWidth={1.6}
                  />
                </div>

                <div>
                  <h3 className="text-2xl font-semibold leading-none tracking-[-0.04em]">
                    {capability.title}
                  </h3>
                  <p className="mt-4 max-w-sm text-sm leading-6 text-[#77716b]">
                    {capability.description}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                    {capability.action}
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-4"
                      strokeWidth={2}
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </PageRail>
  );
}
