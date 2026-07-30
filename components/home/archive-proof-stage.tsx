"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Code2,
  ExternalLink,
  FileText,
  Pause,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const archiveSignals: Array<{ icon: LucideIcon; label: string }> = [
  { icon: CalendarRange, label: "Participation history" },
  { icon: FileText, label: "Project records" },
  { icon: Code2, label: "Technology signals" },
];

export interface ArchiveProofOrganization {
  id: string;
  name: string;
  slug: string;
}

interface ArchiveProofStageProps {
  organizations: ArchiveProofOrganization[];
  totalOrganizations: number;
  snapshotDate: string;
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "GS";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function ArchiveProofStage({
  organizations,
  totalOrganizations,
  snapshotDate,
}: ArchiveProofStageProps) {
  const featured = React.useMemo(() => {
    const unique = new Map<string, ArchiveProofOrganization>();
    for (const organization of organizations) {
      if (organization.id && organization.name && organization.slug) {
        unique.set(organization.id, organization);
      }
    }
    return [...unique.values()].slice(0, 8);
  }, [organizations]);

  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const reducedMotion = useReducedMotion();
  const selected = featured[selectedIndex];
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const select = (index: number, focus = false) => {
    const normalized = (index + featured.length) % featured.length;
    setSelectedIndex(normalized);
    if (focus) tabRefs.current[normalized]?.focus();
  };

  const handleKey = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      select(index + 1, true);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      select(index - 1, true);
    } else if (event.key === "Home") {
      event.preventDefault();
      select(0, true);
    } else if (event.key === "End") {
      event.preventDefault();
      select(featured.length - 1, true);
    }
  };

  if (!selected) {
    return (
      <section className="px-4 pb-24 sm:px-5">
        <div className="mx-auto max-w-[75rem] border border-[#e4e1dc] px-6 py-16 text-center">
          <p className="text-sm text-[#77716b]">
            Featured archive profiles are unavailable right now.
          </p>
          <Link
            href="/organizations"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#242424] px-5 text-sm font-semibold text-white"
          >
            Browse organizations
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pb-24 sm:px-5 lg:pb-32">
      <style>{`
        @keyframes atlas-proof-marquee {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>

      <div className="mx-auto max-w-[75rem]">
        <div className="overflow-hidden border border-[#e4e1dc] bg-white">
          <div className="flex min-h-14 items-center justify-between border-b border-[#e4e1dc] px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#ff5e1f]" />
              <span className="size-2.5 rounded-full bg-[#ddd9d3]" />
              <span className="size-2.5 rounded-full bg-[#ddd9d3]" />
            </div>
            <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[#8e8881]">
              Archive profile preview · {snapshotDate}
            </p>
          </div>

          <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="border-b border-[#e4e1dc] bg-[#faf9f7] p-3 sm:p-5 lg:border-b-0 lg:border-r">
              <p className="px-3 pb-3 font-data text-[10px] uppercase tracking-[0.14em] text-[#8e8881]">
                Featured profiles
              </p>
              <div
                aria-label="Featured organization profiles"
                className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1"
                role="tablist"
              >
                {featured.map((organization, index) => (
                  <button
                    aria-controls="archive-proof-panel"
                    aria-selected={selectedIndex === index}
                    className={cn(
                      "grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold transition-[background-color,color] duration-[180ms]",
                      selectedIndex === index
                        ? "bg-[#242424] text-white"
                        : "text-[#625e59] hover:bg-white hover:text-[#242424]",
                    )}
                    id={`archive-proof-tab-${index}`}
                    key={organization.id}
                    onClick={() => select(index)}
                    onKeyDown={(event) => handleKey(event, index)}
                    ref={(element) => {
                      tabRefs.current[index] = element;
                    }}
                    role="tab"
                    tabIndex={selectedIndex === index ? 0 : -1}
                    type="button"
                  >
                    <span className="font-data text-[9px] opacity-50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{organization.name}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className={cn(
                        "size-4 transition-transform duration-[180ms]",
                        selectedIndex === index ? "translate-x-0" : "-translate-x-1",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <article
              aria-labelledby={`archive-proof-tab-${selectedIndex}`}
              className="relative min-h-[34rem] overflow-hidden bg-[#f4eee7] p-6 sm:p-10 lg:p-12"
              id="archive-proof-panel"
              role="tabpanel"
              tabIndex={0}
            >
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-65 [background-image:radial-gradient(#d7d0c7_1px,transparent_1px)] [background-size:18px_18px] [mask-image:linear-gradient(to_bottom_right,black,transparent_82%)]"
              />
              <div className="relative flex min-h-[28rem] flex-col">
                <div className="flex items-start justify-between gap-5">
                  <span className="flex size-20 items-center justify-center rounded-xl border border-[#d6d0c8] bg-white font-data text-2xl font-semibold shadow-[0_12px_35px_rgb(36_36_36/0.08)]">
                    {initials(selected.name)}
                  </span>
                  <div className="text-right">
                    <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[#8e8881]">
                      Indexed organizations
                    </p>
                    <p className="mt-2 font-data text-2xl font-semibold">
                      {new Intl.NumberFormat("en-US").format(totalOrganizations)}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-14">
                  <p className="font-data text-[10px] uppercase tracking-[0.14em] text-[#d84c1b]">
                    Public GSoC archive record
                  </p>
                  <h3 className="mt-4 max-w-[17ch] text-balance text-[clamp(2.5rem,6vw,5.25rem)] font-semibold leading-[0.9] tracking-[-0.06em]">
                    {selected.name}
                  </h3>
                  <div className="mt-7 grid max-w-2xl gap-2 sm:grid-cols-3">
                    {archiveSignals.map(({ icon: Icon, label }) => (
                      <div
                        className="flex min-h-24 flex-col justify-between rounded-lg border border-[#d9d3cb] bg-white/75 p-3 text-xs font-semibold"
                        key={label}
                      >
                        <Icon
                          aria-hidden="true"
                          className="size-4 text-[#ff5e1f]"
                        />
                        {label}
                      </div>
                    ))}
                  </div>
                  <Link
                    href={`/organizations/${selected.slug}`}
                    className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#242424] px-6 text-sm font-semibold text-white transition-[background-color,transform] duration-[180ms] hover:bg-[#ff5e1f] hover:text-[#242424] active:scale-[0.96]"
                  >
                    Inspect archive profile
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </Link>
                </div>
              </div>
            </article>
          </div>

          <div className="relative flex min-h-20 items-center overflow-hidden border-t border-[#e4e1dc]">
            <div
              aria-hidden="true"
              className="flex w-max motion-reduce:[animation:none]"
              style={{
                animation: "atlas-proof-marquee 34s linear infinite",
                animationPlayState:
                  paused || reducedMotion ? "paused" : "running",
              }}
            >
              {[0, 1].map((copy) => (
                <div className="flex shrink-0 items-center" key={copy}>
                  {featured.map((organization) => (
                    <React.Fragment key={`${copy}-${organization.id}`}>
                      <span className="whitespace-nowrap px-5 text-sm font-semibold text-[#625e59]">
                        {organization.name}
                      </span>
                      <span className="size-1 rounded-full bg-[#ff5e1f]" />
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-white via-white to-transparent pl-16 pr-3">
              <button
                aria-label={
                  reducedMotion
                    ? "Organization rail animation disabled by reduced motion"
                    : paused
                      ? "Resume organization rail"
                      : "Pause organization rail"
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dedbd5] bg-white px-4 text-xs font-semibold transition-[background-color,border-color] duration-[180ms] hover:border-[#aaa49d] hover:bg-[#f5f3ef] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={reducedMotion}
                onClick={() => setPaused((value) => !value)}
                type="button"
              >
                {paused ? (
                  <Play aria-hidden="true" className="size-4" />
                ) : (
                  <Pause aria-hidden="true" className="size-4" />
                )}
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-[#e4e1dc] bg-[#faf9f7] px-5 py-4 text-xs text-[#77716b] sm:flex-row sm:items-center sm:justify-between">
            <p>
              Examples from the public archive · no affiliation or endorsement
              implied.
            </p>
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous featured organization"
                className="flex size-10 items-center justify-center rounded-full border border-[#dedbd5] bg-white hover:border-[#aaa49d]"
                onClick={() => select(selectedIndex - 1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
              </button>
              <button
                aria-label="Next featured organization"
                className="flex size-10 items-center justify-center rounded-full border border-[#dedbd5] bg-white hover:border-[#aaa49d]"
                onClick={() => select(selectedIndex + 1)}
                type="button"
              >
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
