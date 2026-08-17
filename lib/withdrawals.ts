export type WithdrawalEvent = {
  slug: string;
  year: number;
  event: "withdrawn" | "reinstated";
  observed_at: string;
  last_seen_at?: string;
  detected_by: "google-drift" | "manual";
  note?: string;
};

export type WithdrawalLedger = { version: 1; events: WithdrawalEvent[] };

export function withdrawalState(ledger: WithdrawalLedger, year: number) {
  const state = new Map<string, WithdrawalEvent>();
  for (const event of ledger.events.filter((entry) => entry.year === year)) state.set(event.slug, event);
  return state;
}

export function withdrawnSlugsForYear(ledger: WithdrawalLedger, year: number) {
  return new Set(
    [...withdrawalState(ledger, year)].filter(([, event]) => event.event === "withdrawn").map(([slug]) => slug),
  );
}

export function latestWithdrawalFor(
  ledger: WithdrawalLedger,
  slug: string,
  year: number,
): WithdrawalEvent | undefined {
  return [...ledger.events].reverse().find((event) => event.slug === slug && event.year === year && event.event === "withdrawn");
}

export function reconcileWithdrawalEvents(input: {
  ledger: WithdrawalLedger;
  year: number;
  previousSlugs: Iterable<string>;
  currentSlugs: Iterable<string>;
  observedAt: string;
  lastSeenAt: string;
  programIsActive: boolean;
}) {
  if (!input.programIsActive) return { ledger: input.ledger, appended: [] as WithdrawalEvent[] };

  const previous = new Set(input.previousSlugs);
  const current = new Set(input.currentSlugs);
  const state = withdrawalState(input.ledger, input.year);
  const appended: WithdrawalEvent[] = [];

  for (const slug of [...previous].filter((value) => !current.has(value)).sort()) {
    if (state.get(slug)?.event === "withdrawn") continue;
    const event: WithdrawalEvent = {
      slug,
      year: input.year,
      event: "withdrawn",
      observed_at: input.observedAt,
      last_seen_at: input.lastSeenAt,
      detected_by: "google-drift",
    };
    appended.push(event);
    state.set(slug, event);
  }

  for (const slug of [...current].sort()) {
    if (state.get(slug)?.event !== "withdrawn") continue;
    const event: WithdrawalEvent = {
      slug,
      year: input.year,
      event: "reinstated",
      observed_at: input.observedAt,
      detected_by: "google-drift",
    };
    appended.push(event);
    state.set(slug, event);
  }

  return { ledger: { ...input.ledger, events: [...input.ledger.events, ...appended] }, appended };
}
