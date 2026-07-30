import { Badge, MetricCell, SourceNote } from "@/components/ui";

interface ArchiveMetric {
  value: string | number;
  label: string;
  note?: string;
}

interface ArchiveYearHeroProps {
  year: number;
  title: string;
  description: string;
  publishedAt: string;
  finalized?: boolean;
  context: "Year overview" | "Project archive";
  metrics: ArchiveMetric[];
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "archive snapshot";

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function ArchiveYearHero({
  year,
  title,
  description,
  publishedAt,
  finalized,
  context,
  metrics,
}: ArchiveYearHeroProps) {
  return (
    <section className="atlas-grid overflow-hidden rounded-3xl bg-ink text-[#f5eee9]">
      <div className="px-6 pb-12 pt-8 sm:px-10 sm:pb-14 sm:pt-10 lg:px-14 lg:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/15 bg-white/10 text-[#f5eee9]">
              {context}
            </Badge>
            <span className="font-data text-xs text-[#aaa29d]">GSoC {year}</span>
          </div>
          <span className="font-data text-[10px] uppercase tracking-[0.16em] text-[#aaa29d]">
            {finalized ? "Finalized archive" : "Recorded snapshot"}
          </span>
        </div>

        <h1 className="mt-10 max-w-5xl text-balance text-[clamp(3rem,7vw,6.8rem)] font-medium leading-[0.9] tracking-[-0.065em]">
          {title}
        </h1>
        <p className="mt-7 max-w-2xl text-pretty text-base leading-7 text-[#c8c0ba] sm:text-lg">
          {description}
        </p>
        <SourceNote
          className="mt-8"
          inverse
          date={formatDate(publishedAt)}
          source={`GSoC ${year} generated archive`}
        />
      </div>

      <div
        className={`grid border-t border-white/10 sm:grid-cols-2 ${
          metrics.length > 2 ? "lg:grid-cols-4" : ""
        }`}
      >
        {metrics.map((metric, index) => (
          <MetricCell
            key={metric.label}
            inverse
            value={metric.value}
            label={metric.label}
            note={metric.note}
            className={[
              index < metrics.length - 1 ? "border-b border-white/10" : "",
              index % 2 === 0 ? "sm:border-r sm:border-white/10" : "",
              metrics.length > 2 && index < metrics.length - 1
                ? "lg:border-b-0 lg:border-r lg:border-white/10"
                : "",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}
