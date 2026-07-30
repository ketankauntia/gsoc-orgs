"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Braces,
  Building2,
  Code2,
  FileSearch,
  Filter,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface ResearchWorkbenchProps {
  organizations: number;
  activeOrganizations: number;
  projects: number;
  technologies: number;
  topics: number;
}

type ViewId = "organizations" | "projects" | "technologies";

const views = {
  organizations: {
    label: "Organizations",
    eyebrow: "Organization research",
    title: "Build a shortlist from evidence.",
    description:
      "Search the full archive, narrow it by recorded participation and stack, then open the source profile before you decide.",
    href: "/organizations",
    action: "Explore organizations",
    path: ["Search", "Filter", "Profile", "Official links"],
    icon: Building2,
  },
  projects: {
    label: "Projects",
    eyebrow: "Project history",
    title: "See what communities actually built.",
    description:
      "Move through accepted projects by year, contributor, organization, and technology instead of relying on a generic organization summary.",
    href: "/projects",
    action: "Browse project records",
    path: ["Year", "Project", "Contributor", "Code"],
    icon: FileSearch,
  },
  technologies: {
    label: "Technologies & topics",
    eyebrow: "Start from what you know",
    title: "Follow a stack into the right communities.",
    description:
      "Use recorded technology and topic signals as a starting point, then validate the organization through its history and projects.",
    href: "/tech-stack",
    action: "Explore technologies",
    path: ["Technology", "Topic", "Organizations", "Projects"],
    icon: Code2,
  },
} satisfies Record<
  ViewId,
  {
    label: string;
    eyebrow: string;
    title: string;
    description: string;
    href: string;
    action: string;
    path: string[];
    icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  }
>;

const tabs = Object.entries(views) as Array<[ViewId, (typeof views)[ViewId]]>;
const formatter = new Intl.NumberFormat("en-US");

export function ResearchWorkbench({
  organizations,
  activeOrganizations,
  projects,
  technologies,
  topics,
}: ResearchWorkbenchProps) {
  const [activeView, setActiveView] = React.useState<ViewId>("organizations");
  const active = views[activeView];
  const ActiveIcon = active.icon;

  const cards =
    activeView === "organizations"
      ? [
          {
            eyebrow: "Archive",
            value: formatter.format(organizations),
            label: "organization profiles",
            chips: ["years", "projects", "links"],
            href: "/organizations",
          },
          {
            eyebrow: "Latest snapshot",
            value: formatter.format(activeOrganizations),
            label: "recorded as active",
            chips: ["2026", "partial data"],
            href: "/organizations?years=2026",
          },
          {
            eyebrow: "Filters",
            value: "4 lenses",
            label: "year, stack, topic, category",
            chips: ["AND / OR", "URL state"],
            href: "/organizations",
          },
          {
            eyebrow: "Access",
            value: "Free",
            label: "independent research tool",
            chips: ["no account", "open source"],
            href: "/about",
          },
        ]
      : activeView === "projects"
        ? [
            {
              eyebrow: "Archive",
              value: formatter.format(projects),
              label: "recorded projects",
              chips: ["title", "mentor", "code"],
              href: "/projects",
            },
            {
              eyebrow: "Coverage",
              value: "10 years",
              label: "of project documents",
              chips: ["2016", "2025"],
              href: "/projects",
            },
            {
              eyebrow: "Context",
              value: "Linked",
              label: "to organizations and stacks",
              chips: ["org", "year", "technology"],
              href: "/projects",
            },
            {
              eyebrow: "Access",
              value: "Source",
              label: "when the archive supplies it",
              chips: ["code URL", "caveats"],
              href: "/projects",
            },
          ]
        : [
            {
              eyebrow: "Technology",
              value: formatter.format(technologies),
              label: "recorded technology tags",
              chips: ["usage", "years", "orgs"],
              href: "/tech-stack",
            },
            {
              eyebrow: "Topics",
              value: formatter.format(topics),
              label: "recorded interest tags",
              chips: ["domains", "projects"],
              href: "/topics",
            },
            {
              eyebrow: "Connections",
              value: "Mapped",
              label: "back to organizations",
              chips: ["profiles", "history"],
              href: "/tech-stack",
            },
            {
              eyebrow: "Interpretation",
              value: "Careful",
              label: "tags are signals, not scores",
              chips: ["source", "freshness"],
              href: "/about",
            },
          ];

  return (
    <div className="overflow-hidden border border-[#e4e2de] bg-white">
      <div
        aria-label="Choose an archive view"
        className="mx-auto my-10 flex w-[calc(100%-2rem)] max-w-[42rem] overflow-x-auto rounded-full border border-[#e5e2dd] bg-white p-1"
        role="tablist"
      >
        {tabs.map(([id, view]) => (
          <button
            aria-controls="research-workbench-panel"
            aria-selected={activeView === id}
            className={cn(
              "min-h-11 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-[background-color,color] duration-[180ms]",
              activeView === id
                ? "bg-[#242424] text-white"
                : "text-[#6c6863] hover:bg-[#f4f2ee] hover:text-[#242424]",
            )}
            id={`research-workbench-${id}`}
            key={id}
            onClick={() => setActiveView(id)}
            role="tab"
            type="button"
          >
            {view.label}
          </button>
        ))}
      </div>

      <div
        aria-labelledby={`research-workbench-${activeView}`}
        className="grid border-t border-[#e7e4df] lg:grid-cols-[0.9fr_1.1fr]"
        id="research-workbench-panel"
        role="tabpanel"
      >
        <div className="flex min-h-[25rem] flex-col justify-between border-b border-[#e7e4df] p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-11">
          <div>
            <div className="flex size-11 items-center justify-center rounded-xl border border-[#dedbd5]">
              <ActiveIcon aria-hidden="true" className="size-5 text-[#ff5e1f]" />
            </div>
            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.14em] text-[#d84c1b]">
              {active.eyebrow}
            </p>
            <h3 className="mt-4 max-w-[14ch] text-[clamp(2rem,4vw,3.8rem)] font-semibold leading-[0.96] tracking-[-0.055em]">
              {active.title}
            </h3>
            <p className="mt-5 max-w-xl text-sm leading-6 text-[#716d67] sm:text-base">
              {active.description}
            </p>
          </div>
          <Link
            className="mt-10 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-[#d9d6d0] px-5 text-sm font-semibold transition-[background-color,border-color,transform] duration-[180ms] hover:border-[#242424] hover:bg-[#242424] hover:text-white active:scale-[0.96]"
            href={active.href}
          >
            {active.action}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="relative flex min-h-[25rem] items-center justify-center overflow-hidden bg-[#faf9f7] p-6 sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-50 [background-image:radial-gradient(#d9d5cf_1px,transparent_1px)] [background-size:16px_16px]"
          />
          <div className="relative w-full max-w-2xl rounded-xl border border-[#dedbd5] bg-white p-4 shadow-[0_18px_45px_rgb(36_36_36/0.08)] sm:p-6">
            <div className="flex items-center justify-between border-b border-[#ece9e4] pb-4">
              <span className="inline-flex items-center gap-2 text-xs font-semibold">
                <span className="size-2 rounded-full bg-[#ff5e1f]" />
                Research path
              </span>
              <span className="font-data text-[10px] uppercase tracking-[0.12em] text-[#8c8780]">
                sourced archive
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              {active.path.map((step, index) => {
                const icons = [Search, Filter, Braces, BookOpen];
                const Icon = icons[index];
                return (
                  <div
                    className="relative flex min-h-28 flex-col justify-between rounded-lg border border-[#e7e4df] bg-[#faf9f7] p-3"
                    key={step}
                  >
                    <Icon aria-hidden="true" className="size-4 text-[#ff5e1f]" />
                    <div>
                      <span className="font-data text-[9px] text-[#969089]">
                        0{index + 1}
                      </span>
                      <p className="mt-1 text-xs font-semibold">{step}</p>
                    </div>
                    {index < active.path.length - 1 ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="absolute -right-2.5 top-1/2 z-10 hidden size-4 -translate-y-1/2 rounded-full bg-white text-[#9d9790] sm:block"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid border-t border-[#e7e4df] sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Link
            className={cn(
              "group flex min-h-[17rem] flex-col justify-between p-6 transition-colors duration-[180ms] hover:bg-[#faf9f7]",
              index < cards.length - 1 && "border-b border-[#e7e4df] sm:border-r",
              index === 1 && "lg:border-b-0",
              index === 2 && "sm:border-b-0",
            )}
            href={card.href}
            key={card.eyebrow}
          >
            <div>
              <p className="text-sm font-semibold">{card.eyebrow}</p>
              <p className="mt-1 text-sm text-[#77726c]">{card.label}</p>
            </div>
            <div>
              <p className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-none tracking-[-0.055em]">
                {card.value}
              </p>
              <div className="mt-5 flex flex-wrap gap-1.5">
                {card.chips.map((chip) => (
                  <span
                    className="rounded-md border border-dashed border-[#dedbd5] px-2 py-1 text-[11px] text-[#716c66]"
                    key={chip}
                  >
                    {chip}
                  </span>
                ))}
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                Open
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-[180ms] group-hover:translate-x-1"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
