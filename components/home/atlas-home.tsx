import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Braces,
  Check,
  CircleCheck,
  Code2,
  GitBranch,
  GitCompareArrows,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import type { HomepageData } from "@/lib/homepage-types";
import { ArchiveProofStage } from "@/components/home/archive-proof-stage";
import { RegionOpenSource } from "@/components/home/region-open-source";
import { ResearchWorkbench } from "@/components/home/research-workbench";
import { Button } from "@/components/ui/button";

interface AtlasHomeProps {
  data: HomepageData | null;
  technologyCount: number;
  topicCount: number;
}

function formatSnapshotDate(value?: string) {
  if (!value) return "date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date unavailable";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function DotField({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.34) 1px, transparent 1.35px)",
        backgroundSize: "7px 7px",
        maskImage:
          "radial-gradient(ellipse 66% 72% at 50% 52%, black 0%, transparent 78%)",
      }}
    />
  );
}

function ComparisonStage() {
  return (
    <section className="px-4 py-24 sm:px-5 lg:py-32">
      <div className="mx-auto max-w-[75rem]">
        <div className="text-center">
          <p className="mb-5 font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-[#d84c1b]">
            Why choose GSoC Atlas
          </p>
          <h2 className="text-balance text-[clamp(2.6rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
            Research, not roulette.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#77716b] sm:text-lg">
            Replace scattered tabs and guesswork with connected,
            source-aware profiles.
          </p>
        </div>

        <div className="mt-14 grid overflow-hidden border border-[#e4e1dc] lg:grid-cols-2">
          <article className="relative min-h-[34rem] overflow-hidden border-b border-[#e4e1dc] bg-white p-6 lg:border-b-0 lg:border-r lg:p-10">
            <h3 className="relative z-10 mx-auto max-w-sm text-center text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
              Researching with scattered tabs
            </h3>

            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 top-28 opacity-65 [background-image:radial-gradient(#ff9d78_1px,transparent_1px)] [background-size:8px_8px] [mask-image:linear-gradient(to_bottom,transparent,black_28%,transparent_92%)]"
            />
            <div className="relative mx-auto mt-20 h-72 max-w-lg">
              {[
                ["search results", "left-[3%] top-[8%] -rotate-3"],
                ["old spreadsheet", "right-[2%] top-[18%] rotate-2"],
                ["project page", "left-[18%] top-[43%] rotate-1"],
                ["stale blog post", "right-[13%] top-[57%] -rotate-2"],
                ["Which year?", "left-[34%] top-[72%] rotate-3"],
              ].map(([label, position]) => (
                <div
                  className={`absolute rounded-md border border-[#d9d6d1] bg-white px-4 py-3 text-xs font-semibold text-[#77716b] shadow-[0_8px_22px_rgb(36_36_36/0.08)] ${position}`}
                  key={label}
                >
                  <span className="mr-2 inline-block size-2 rounded-full bg-[#d5d1cb]" />
                  {label}
                </div>
              ))}
            </div>
          </article>

          <article className="relative min-h-[34rem] overflow-hidden bg-[#ff5e1f] p-6 text-[#242424] lg:p-10">
            <DotField className="opacity-55" />
            <h3 className="relative z-10 mx-auto max-w-sm text-center text-[clamp(2rem,4vw,3.5rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
              Researching with GSoC Atlas
            </h3>

            <div className="relative z-10 mx-auto mt-14 max-w-md overflow-hidden rounded-xl border border-[#242424]/18 bg-white shadow-[0_20px_55px_rgb(115_36_7/0.18)]">
              <div className="flex items-center justify-between border-b border-[#e7e3de] px-4 py-3">
                <div className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ff5e1f]" />
                  <span className="size-2.5 rounded-full bg-[#dedad4]" />
                  <span className="size-2.5 rounded-full bg-[#dedad4]" />
                </div>
                <span className="font-data text-[9px] uppercase tracking-[0.12em] text-[#8b857e]">
                  sourced profile
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-[#fff0e8] font-data text-xs font-bold text-[#8b3210]">
                    OS
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      One organization record
                    </p>
                    <p className="mt-0.5 text-xs text-[#77716b]">
                      History, projects, stack, official links
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 border-y border-[#e7e3de] py-4">
                  {[
                    ["11", "years"],
                    ["64", "projects"],
                    ["2026", "latest"],
                  ].map(([value, label], index) => (
                    <div
                      className={
                        index > 0 ? "border-l border-[#e7e3de] pl-4" : ""
                      }
                      key={label}
                    >
                      <p className="font-data text-xl font-semibold">{value}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-[#8b857e]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
                <ul className="mt-5 space-y-3 text-xs text-[#625e59]">
                  {[
                    "Participation timeline attached",
                    "Project records connected",
                    "Freshness and source visible",
                  ].map((item) => (
                    <li className="flex items-center gap-2" key={item}>
                      <CircleCheck
                        aria-hidden="true"
                        className="size-4 text-[#16845b]"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>

          <div className="col-span-full flex flex-col gap-3 border-t border-[#e4e1dc] bg-[#faf9f7] px-6 py-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">
              No selection scores. No “easy organization” labels.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 font-semibold text-[#d84c1b]"
            >
              Read the methodology
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ResearchBento() {
  const steps = ["Discover", "Verify", "Study", "Prepare"];

  return (
    <section className="px-4 py-24 sm:px-5 lg:py-32">
      <div className="mx-auto max-w-[75rem]">
        <div className="text-center">
          <h2 className="text-balance text-[clamp(2.6rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
            Fits the way research actually happens.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#77716b] sm:text-lg">
            Useful whether you already have a shortlist or are starting with
            one familiar technology.
          </p>
        </div>

        <div className="mt-14 grid gap-2 lg:grid-cols-12">
          <article className="relative flex min-h-[26rem] flex-col justify-between overflow-hidden border border-[#e4e1dc] bg-white p-6 sm:p-9 lg:col-span-8">
            <div className="flex items-start justify-between">
              <div className="flex size-12 items-center justify-center rounded-lg bg-[#ff5e1f]">
                <GitBranch aria-hidden="true" className="size-6" />
              </div>
              <span className="font-data text-[10px] uppercase tracking-[0.14em] text-[#8b857e]">
                research workflow
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.035em]">
                Fits into the way you already investigate.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#77716b]">
                Start with a name, a stack, a topic, or a year. Every path can
                lead back to the same connected evidence.
              </p>
              <div className="mt-8 grid border border-[#e4e1dc] sm:grid-cols-4">
                {steps.map((step, index) => (
                  <div
                    className={`relative min-h-28 p-4 ${
                      index < steps.length - 1
                        ? "border-b border-[#e4e1dc] sm:border-b-0 sm:border-r"
                        : ""
                    }`}
                    key={step}
                  >
                    <span className="font-data text-[10px] text-[#aaa49d]">
                      0{index + 1}
                    </span>
                    <p className="mt-8 text-sm font-semibold">{step}</p>
                    {index < steps.length - 1 ? (
                      <ArrowRight
                        aria-hidden="true"
                        className="absolute -right-2.5 top-1/2 z-10 hidden size-4 -translate-y-1/2 bg-white text-[#aaa49d] sm:block"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="relative flex min-h-[26rem] flex-col justify-between overflow-hidden border border-[#e04d18] bg-[#ff5e1f] p-6 sm:p-9 lg:col-span-4">
            <DotField className="opacity-50" />
            <ShieldCheck
              aria-hidden="true"
              className="relative size-7"
              strokeWidth={1.7}
            />
            <div className="relative">
              <h3 className="text-2xl font-semibold tracking-[-0.035em]">
                Sources stay attached.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#242424]/72">
                Snapshot dates, official links, and archive caveats remain
                visible where they matter.
              </p>
            </div>
          </article>

          <article className="flex min-h-[26rem] flex-col justify-between border border-[#e4e1dc] bg-white p-6 sm:p-9 lg:col-span-4">
            <GitCompareArrows
              aria-hidden="true"
              className="size-7 text-[#ff5e1f]"
              strokeWidth={1.7}
            />
            <div>
              <h3 className="text-2xl font-semibold tracking-[-0.035em]">
                No mystery score.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#77716b]">
                The atlas helps you compare facts. It does not pretend to know
                your chance of selection.
              </p>
            </div>
          </article>

          <article className="relative min-h-[26rem] overflow-hidden border border-[#e4e1dc] bg-white p-6 sm:p-9 lg:col-span-8">
            <div className="max-w-sm">
              <div className="flex items-center gap-2">
                <Sparkles
                  aria-hidden="true"
                  className="size-5 text-[#ff5e1f]"
                />
                <span className="rounded-full border border-[#dedbd5] px-2 py-1 font-data text-[9px] uppercase tracking-[0.12em] text-[#77716b]">
                  Planned preview
                </span>
              </div>
              <h3 className="mt-8 text-2xl font-semibold tracking-[-0.035em]">
                AI insights, with receipts.
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#77716b]">
                Future summaries will need citations, freshness, and a clear
                line between archive facts and generated interpretation.
              </p>
            </div>

            <div className="mt-9 overflow-hidden rounded-lg border border-[#dedbd5] bg-[#faf9f7] lg:absolute lg:bottom-8 lg:right-8 lg:mt-0 lg:w-[52%]">
              <div className="border-b border-[#e4e1dc] bg-white px-4 py-3 text-xs font-semibold">
                Building organization brief…
              </div>
              <div className="space-y-3 p-4 font-data text-[10px] text-[#69645e]">
                {[
                  ["participation", "11 years", "source attached"],
                  ["projects", "64 records", "source attached"],
                  ["interpretation", "fit questions", "confidence shown"],
                ].map(([label, value, state], index) => (
                  <div className="flex items-center gap-2" key={label}>
                    <span
                      className={`size-1.5 rounded-full ${
                        index === 2 ? "bg-[#ff5e1f]" : "bg-[#16845b]"
                      }`}
                    />
                    <span className="rounded border border-[#dedbd5] bg-white px-2 py-1">
                      {label}
                    </span>
                    <ArrowRight className="size-3 text-[#aaa49d]" />
                    <span>{value}</span>
                    <span className="ml-auto hidden text-[#9a948d] sm:inline">
                      {state}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-[#e4e1dc] bg-white p-3">
                <Braces aria-hidden="true" className="size-4" />
                <span className="text-xs text-[#9a948d]">
                  Ask a sourced question
                </span>
                <span className="ml-auto rounded-md bg-[#ff5e1f] px-3 py-1.5 text-xs font-semibold">
                  Enter ↵
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function AtlasHome({
  data,
  technologyCount,
  topicCount,
}: AtlasHomeProps) {
  const metrics = data?.metrics;
  const snapshotDate = formatSnapshotDate(
    data?.meta.generated_at ?? data?.published_at,
  );
  const organizations = data?.featured_organizations.slice(0, 8) ?? [];

  return (
    <div className="overflow-x-clip bg-white text-[#242424]">
      <section className="px-2 pb-2 sm:px-3 sm:pb-3">
        <div className="relative mx-auto min-h-[43rem] max-w-[87rem] overflow-hidden rounded-[1.5rem] bg-[#ff5e1f] text-center sm:min-h-[47rem]">
          <DotField />
          <div
            aria-hidden="true"
            className="absolute -bottom-64 left-1/2 size-[38rem] -translate-x-1/2 rounded-full bg-[#ffe5a8] opacity-90 blur-[55px]"
          />
          <Link
            href="/yearly/google-summer-of-code-2026"
            className="relative z-10 flex min-h-12 w-full items-center justify-center gap-2 border-b border-white/25 px-4 text-xs font-semibold text-white transition-[background-color] duration-[180ms] hover:bg-white/10 sm:text-sm"
          >
            GSoC 2026 archive · Latest organization snapshot · {snapshotDate}
            <span className="underline underline-offset-4">Explore the year</span>
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>

          <div className="relative z-10 flex min-h-[calc(43rem-3rem)] items-center justify-center px-5 py-16 sm:min-h-[calc(47rem-3rem)] sm:px-10 lg:py-20">
            <div className="flex w-full max-w-5xl flex-col items-center">
              <h1 className="max-w-[17ch] text-balance text-[clamp(3.2rem,7.2vw,7.1rem)] font-semibold leading-[0.88] tracking-[-0.067em] text-white">
                A decade of GSoC organization history—mapped for your next move.
              </h1>
              <p className="mt-8 max-w-2xl text-pretty text-base leading-7 text-white/90 sm:text-lg">
                One research platform for organizations, projects, stacks, and
                years. Explore, compare, and prepare without scattered
                spreadsheets.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-9 bg-white text-[#242424] shadow-none hover:bg-[#f5f3ef]"
              >
                <Link href="/organizations">
                  Start exploring
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <RegionOpenSource
        activeOrganizations={metrics?.active_organizations ?? 0}
        snapshotDate={snapshotDate}
        totalOrganizations={metrics?.total_organizations ?? 0}
        totalProjects={metrics?.total_projects ?? 0}
      />

      <section className="px-4 pb-8 pt-20 text-center sm:px-5 lg:pt-28">
        <div className="mx-auto max-w-[75rem]">
          <h2 className="mx-auto max-w-[16ch] text-balance text-[clamp(2.7rem,6vw,5.8rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
            One archive. Thousands of open-source paths.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#77716b] sm:text-lg">
            Explore the communities, projects, and technologies that shaped
            Google Summer of Code across the years.
          </p>
        </div>
      </section>

      <ArchiveProofStage
        organizations={organizations}
        snapshotDate={snapshotDate}
        totalOrganizations={metrics?.total_organizations ?? 0}
      />

      <ComparisonStage />

      <section className="px-4 py-24 sm:px-5 lg:py-32">
        <div className="mx-auto max-w-[75rem]">
          <div className="text-center">
            <h2 className="text-balance text-[clamp(2.6rem,6vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.06em]">
              Start with what you already know.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#77716b] sm:text-lg">
              A name, a stack, a topic, or a program year can all become a
              useful research path.
            </p>
          </div>

          <div className="mt-14">
            <ResearchWorkbench
              activeOrganizations={metrics?.active_organizations ?? 0}
              organizations={metrics?.total_organizations ?? 0}
              projects={metrics?.total_projects ?? 0}
              technologies={technologyCount}
              topics={topicCount}
            />
          </div>
        </div>
      </section>

      <ResearchBento />

      <section className="px-2 pb-2 pt-10 sm:px-3 sm:pb-3 lg:pt-16">
        <div className="relative mx-auto flex min-h-[38rem] max-w-[87rem] items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#ff5e1f] px-6 py-24 text-center sm:px-10">
          <DotField />
          <div
            aria-hidden="true"
            className="absolute -bottom-72 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-[#ffe5a8] opacity-90 blur-[60px]"
          />
          <div className="relative z-10 flex max-w-4xl flex-col items-center">
            <Check aria-hidden="true" className="size-8 text-white" />
            <h2 className="mt-8 text-balance text-[clamp(3rem,7vw,6.8rem)] font-semibold leading-[0.88] tracking-[-0.065em] text-white">
              Turn a huge archive into one useful next step.
            </h2>
            <p className="mt-8 max-w-2xl text-base leading-7 text-white/90 sm:text-lg">
              Open an organization profile, inspect the evidence, and leave
              with better questions for the community.
            </p>
            <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full bg-white text-[#242424] hover:bg-[#f5f3ef] sm:w-auto"
              >
                <Link href="/organizations">
                  Explore organizations
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-white/50 bg-white/10 text-white hover:border-white hover:bg-white/20 sm:w-auto"
              >
                <Link href="/tech-stack">
                  Browse technologies
                  <Code2 aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
