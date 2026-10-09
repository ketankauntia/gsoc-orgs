import Image from "next/image";
import Link from "next/link";
import { initials } from "./labels";
import type { TreemapGroup } from "./data";

export const fmt = (value: number) => value.toLocaleString("en-US");
export const plural = (count: number, one: string, many = `${one}s`) => `${fmt(count)} ${count === 1 ? one : many}`;

/** Logo on a white plate (all 522 have one); initials if a file is ever missing. */
export function Logo({ org, size = "md", className }: { org: { name: string; logo: string | null; logoDark?: boolean }; size?: "xs" | "sm" | "md" | "lg" | "xl"; className?: string }) {
  const px = { xs: 20, sm: 28, md: 36, lg: 56, xl: 88 }[size];
  return (
    <span className={`cb-logo cb-logo-${size}${className ? ` ${className}` : ""}`} data-dark={org.logoDark || undefined} aria-hidden="true">
      {org.logo ? <Image src={org.logo} alt="" width={px} height={px} /> : <span className="cb-monogram">{initials(org.name)}</span>}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`cb-eyebrow${className ? ` ${className}` : ""}`}>{children}</p>;
}

export function StatTile({ label, value, context, accent }: { label: string; value: React.ReactNode; context?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="cb-stat" data-accent={accent || undefined}>
      <p className="cb-stat-label">{label}</p>
      <p className="cb-stat-value">{value}</p>
      {context ? <p className="cb-stat-context">{context}</p> : null}
    </div>
  );
}

/** "View as table" twin for a chart: every value reachable without hovering. */
export function TableView({ caption, head, rows }: { caption: string; head: string[]; rows: Array<Array<string | number>> }) {
  return (
    <details className="cb-table-view">
      <summary>View as table</summary>
      <div className="cb-table-scroll cb-scroll-autohide">
        <table>
          <caption className="cb-sr-only">{caption}</caption>
          <thead><tr>{head.map((cell) => <th key={cell} scope="col">{cell}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, i) => i === 0 ? <th key={i} scope="row">{cell}</th> : <td key={i}>{typeof cell === "number" ? fmt(cell) : cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  );
}

/** Round up to 1, 2, 2.5 or 5 × 10^n so gridlines land on clean numbers. */
export function niceMax(value: number) {
  if (value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  for (const step of [1, 2, 2.5, 5, 10]) if (step * power >= value) return step * power;
  return 10 * power;
}

/** Eleven-year sparkline: one column per cycle, the current one in the accent. */
export function Sparkline({ values, years, name, width = 92, height = 26 }: { values: number[]; years: number[]; name: string; width?: number; height?: number }) {
  const max = Math.max(1, ...values);
  const gap = 2;
  const bar = (width - gap * (values.length - 1)) / values.length;
  const rows = years.map((year, index) => `${index === years.length - 1 ? "a" : "m"}|${year}|${values[index] ? fmt(values[index]) : "–"}`).join("\n");
  return (
    <svg className="cb-spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={`${name}: contributors per year ${years[0]} to ${years[years.length - 1]}: ${values.join(", ")}`} data-tip={`${name}, contributors per cycle`} data-tip-rows={rows}>
      {values.map((value, index) => {
        const x = index * (bar + gap);
        if (!value) return <rect key={index} x={x} y={height - 1.5} width={bar} height={1.5} className="cb-spark-zero" />;
        const h = Math.max(3, (value / max) * height);
        return <rect key={index} x={x} y={height - h} width={bar} height={h} rx={1.2} className={index === values.length - 1 ? "cb-spark-now" : undefined} />;
      })}
    </svg>
  );
}

/**
 * Column chart, one series, optional comparison line (same unit, same axis).
 * `accent` picks the highlighted columns; the rest use the quiet series colour.
 */
export function ColumnChart({ labels, series, compare, accent = "last", height = 220, compact = false, caption, labelValues = "ends" }: {
  labels: Array<string | number>;
  series: { label: string; values: Array<number | null> };
  compare?: { label: string; values: number[] };
  accent?: "last" | "all" | number;
  height?: number;
  compact?: boolean;
  caption: string;
  labelValues?: "ends" | "all" | "none";
}) {
  const values = series.values.map((value) => value ?? 0);
  const max = niceMax(Math.max(...values, ...(compare?.values ?? [0])));
  const last = labels.length - 1;
  const peak = values.indexOf(Math.max(...values));
  const isAccent = (index: number) => accent === "all" || (accent === "last" ? index === last : index === accent);
  const showLabel = (index: number) => labelValues === "all" || (labelValues === "ends" && (index === last || index === peak));
  const center = (index: number) => ((index + 0.5) / labels.length) * 1000;
  const compareRows = (index: number) => (compare ? `\nm|${compare.label}|${fmt(compare.values[index])}` : "");
  return (
    <figure className="cb-cols" data-compact={compact || undefined}>
      {compare ? (
        <div className="cb-legend" aria-hidden="true">
          <span><i data-key="a" />{series.label}</span>
          <span><i data-key="line" />{compare.label}</span>
        </div>
      ) : null}
      <div className="cb-cols-frame">
        {!compact ? (
          <div className="cb-cols-ticks" aria-hidden="true">
            {[max, max / 2, 0].map((tick) => <span key={tick}>{fmt(tick)}</span>)}
          </div>
        ) : null}
        <div className="cb-cols-plot" style={{ height }}>
          <div className="cb-cols-grid" aria-hidden="true"><i /><i /><i /></div>
          <ol className="cb-cols-bars">
            {labels.map((label, index) => {
              const raw = series.values[index];
              return (
                <li
                  key={label}
                  tabIndex={0}
                  data-tip={String(label)}
                  data-tip-rows={`a|${series.label}|${raw === null ? "No data" : fmt(raw)}${compareRows(index)}`}
                  aria-label={`${label}: ${raw === null ? "no data" : fmt(raw)}${compare ? `; ${compare.label} ${fmt(compare.values[index])}` : ""}`}
                >
                  {raw === null ? <span className="cb-col-na">n/a</span> : (
                    <span className="cb-col" data-accent={isAccent(index) || undefined} data-zero={raw === 0 || undefined} style={{ height: `${(raw / max) * 100}%` }}>
                      {showLabel(index) && raw > 0 ? <b>{fmt(raw)}</b> : null}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {compare ? (
            <>
              <svg className="cb-cols-line" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline points={compare.values.map((value, index) => `${center(index)},${100 - (value / max) * 100}`).join(" ")} vectorEffect="non-scaling-stroke" />
              </svg>
              {compare.values.map((value, index) => (
                <i key={index} className="cb-cols-dot" style={{ left: `${center(index) / 10}%`, bottom: `${(value / max) * 100}%` }} aria-hidden="true" />
              ))}
            </>
          ) : null}
        </div>
        <ol className="cb-cols-axis" aria-hidden="true">
          {labels.map((label, index) => <li key={label} data-edge={index === 0 || index === last || undefined}>{compact ? `’${String(label).slice(-2)}` : <><span className="cb-axis-long">{label}</span><span className="cb-axis-short">’{String(label).slice(-2)}</span></>}</li>)}
        </ol>
      </div>
      <TableView caption={caption} head={["", series.label, ...(compare ? [compare.label] : [])]} rows={labels.map((label, index) => [String(label), series.values[index] ?? "n/a", ...(compare ? [compare.values[index]] : [])])} />
    </figure>
  );
}

/** Horizontal bars with a tick for the previous value. */
export function BarList({ rows, nowLabel, thenLabel, caption }: {
  rows: Array<{ key: string; label: string; href: string; logo?: { name: string; logo: string | null; logoDark?: boolean }; now: number; then: number; isNew?: boolean }>;
  nowLabel: string;
  thenLabel: string;
  caption: string;
}) {
  const max = niceMax(Math.max(...rows.map((row) => Math.max(row.now, row.then))));
  return (
    <figure className="cb-barlist">
      <div className="cb-legend" aria-hidden="true">
        <span><i data-key="a" />{nowLabel}</span>
        <span><i data-key="tick" />{thenLabel}</span>
      </div>
      <ol>
        {rows.map((row) => {
          const change = row.now - row.then;
          return (
            <li key={row.key}>
              <Link href={row.href} className="cb-barlist-name">
                {row.logo ? <Logo org={row.logo} size="xs" /> : null}
                <span className="cb-truncate">{row.label}</span>
              </Link>
              <span className="cb-barlist-track" data-tip={row.label} data-tip-rows={`a|${nowLabel}|${fmt(row.now)}\nm|${thenLabel}|${row.then ? fmt(row.then) : row.isNew ? "Not yet in the program" : "Did not take part"}`}>
                <span className="cb-barlist-bar" style={{ width: `${(row.now / max) * 100}%` }} />
                {row.then ? <span className="cb-barlist-tick" style={{ left: `${(row.then / max) * 100}%` }} /> : null}
              </span>
              <span className="cb-barlist-value">
                <strong>{fmt(row.now)}</strong>
                <small data-tone={row.then === 0 ? "new" : change > 0 ? "up" : change < 0 ? "down" : undefined}>{row.then === 0 ? (row.isNew ? "new" : "back") : change === 0 ? "same" : `${change > 0 ? "+" : "−"}${Math.abs(change)}`}</small>
              </span>
            </li>
          );
        })}
      </ol>
      <TableView caption={caption} head={["Organization", nowLabel, thenLabel]} rows={rows.map((row) => [row.label, row.now, row.then])} />
    </figure>
  );
}

/** Before → after per row on one shared scale. */
export function Dumbbell({ rows, nowLabel, thenLabel, caption, unit, hrefFor }: {
  rows: Array<{ value: string; label: string; now: number; then: number; nowOrgs: number; thenOrgs: number }>;
  nowLabel: string;
  thenLabel: string;
  caption: string;
  unit: string;
  hrefFor: (value: string) => string;
}) {
  const max = niceMax(Math.max(...rows.map((row) => Math.max(row.now, row.then))));
  return (
    <figure className="cb-dumbbell">
      <div className="cb-legend" aria-hidden="true">
        <span><i data-key="dot-a" />{nowLabel}</span>
        <span><i data-key="dot-m" />{thenLabel}</span>
      </div>
      <ol>
        {rows.map((row) => {
          const low = Math.min(row.now, row.then);
          const high = Math.max(row.now, row.then);
          const change = row.now - row.then;
          return (
            <li key={row.value}>
              <Link href={hrefFor(row.value)} className="cb-dumbbell-label">{row.label}</Link>
              <span className="cb-dumbbell-track" data-tip={row.label} data-tip-rows={`a|${nowLabel}|${fmt(row.now)} ${unit} · ${row.nowOrgs} orgs\nm|${thenLabel}|${fmt(row.then)} ${unit} · ${row.thenOrgs} orgs`}>
                <span className="cb-dumbbell-span" style={{ left: `${(low / max) * 100}%`, width: `${((high - low) / max) * 100}%` }} />
                <i className="cb-dumbbell-then" style={{ left: `${(row.then / max) * 100}%` }} />
                <i className="cb-dumbbell-now" style={{ left: `${(row.now / max) * 100}%` }} />
              </span>
              <span className="cb-dumbbell-value">
                <strong>{fmt(row.now)}</strong>
                <small data-tone={change > 0 ? "up" : change < 0 ? "down" : undefined}>{change === 0 ? "same" : `${change > 0 ? "+" : "−"}${fmt(Math.abs(change))}`}</small>
              </span>
            </li>
          );
        })}
      </ol>
      <div className="cb-dumbbell-axis" aria-hidden="true"><span>0</span><span>{fmt(max / 2)}</span><span>{fmt(max)}</span></div>
      <TableView caption={caption} head={["Technology", nowLabel, thenLabel]} rows={rows.map((row) => [row.label, row.now, row.then])} />
    </figure>
  );
}

/** Two treemap layouts (wide and tall); CSS shows the one that fits. */
export function Treemap({ desktop, mobile, hrefFor, caption }: { desktop: TreemapGroup[]; mobile: TreemapGroup[]; hrefFor: (slug: string) => string; caption: string }) {
  const layout = (groups: TreemapGroup[], variant: "wide" | "tall") => (
    <div className={`cb-tm cb-tm-${variant}`}>
      {groups.map((group) => (
        <div key={group.category} className="cb-tm-group" style={{ left: `${group.x}%`, top: `${group.y}%`, width: `${group.w}%`, height: `${group.h}%` }}>
          {group.labelled ? <p className="cb-tm-label"><span className="cb-truncate">{group.category}</span><span>{fmt(group.value)}</span></p> : null}
        </div>
      ))}
      {groups.flatMap((group) => group.tiles).map((tile) => (
        <Link
          key={tile.slug}
          href={hrefFor(tile.slug)}
          className="cb-tm-tile"
          data-new={tile.isNew || undefined}
          style={{ left: `${tile.x}%`, top: `${tile.y}%`, width: `${tile.w}%`, height: `${tile.h}%` }}
          data-tip={tile.name}
          data-tip-rows={`${tile.isNew ? "a" : "m"}|Contributors in 2026|${fmt(tile.value)}\n-|Category|${tile.category}\n-|Cycles since 2016|${tile.isNew ? "First time" : fmt(tile.cycles)}`}
          aria-label={`${tile.name}: ${plural(tile.value, "contributor")} in 2026${tile.isNew ? ", first time in the program" : ""}`}
        >
          <span className="cb-tm-inner">
            {tile.logo ? <Image className="cb-tm-logo" data-dark={tile.logoDark || undefined} src={tile.logo} alt="" width={24} height={24} /> : null}
            <span className="cb-tm-name">{tile.name}</span>
            <span className="cb-tm-value">{tile.value}</span>
          </span>
        </Link>
      ))}
    </div>
  );
  const rows = desktop.flatMap((group) => group.tiles).sort((a, b) => b.value - a.value);
  return (
    <figure className="cb-treemap">
      {layout(desktop, "wide")}
      {layout(mobile, "tall")}
      <TableView caption={caption} head={["Organization", "Contributors in 2026", "Category"]} rows={rows.map((tile) => [tile.name, tile.value, tile.category])} />
    </figure>
  );
}

/** Columns with the value on each cap; one emphasised bucket. */
export function Histogram({ buckets, emphasis, caption, unit, head = "Contributors" }: { buckets: Array<{ label: string; value: number }>; emphasis: string; caption: string; unit: string; head?: string }) {
  const max = Math.max(...buckets.map((bucket) => bucket.value));
  return (
    <figure className="cb-hist">
      <ol>
        {buckets.map((bucket) => (
          <li key={bucket.label} tabIndex={0} data-tip={`${bucket.label} ${unit}`} data-tip-rows={`${bucket.label === emphasis ? "a" : "m"}|Organizations|${fmt(bucket.value)}`}>
            <span className="cb-hist-plot">
              <span className="cb-hist-bar" data-accent={bucket.label === emphasis || undefined} style={{ height: `${(bucket.value / max) * 100}%` }}><b>{bucket.value}</b></span>
            </span>
            <span className="cb-hist-label">{bucket.label}</span>
          </li>
        ))}
      </ol>
      <TableView caption={caption} head={[head, "Organizations"]} rows={buckets.map((bucket) => [bucket.label, bucket.value])} />
    </figure>
  );
}
