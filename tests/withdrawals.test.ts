import { describe, expect, it } from "vitest";
import { reconcileWithdrawalEvents, withdrawnSlugsForYear, type WithdrawalLedger } from "../lib/withdrawals";
import { canonicalizeOrganizationSnapshot, createOrganizationIdentityResolver } from "../scripts/lib/org-identity";

const emptyLedger = (): WithdrawalLedger => ({ version: 1, events: [] });

describe("withdrawal ledger", () => {
  it("records one genuine removal and stays idempotent", () => {
    const first = reconcileWithdrawalEvents({
      ledger: emptyLedger(), year: 2026, previousSlugs: ["one", "two"], currentSlugs: ["one"],
      observedAt: "2026-08-17T00:00:00.000Z", lastSeenAt: "2026-08-16T00:00:00.000Z", programIsActive: true,
    });
    expect(first.appended.map((event) => event.slug)).toEqual(["two"]);
    const second = reconcileWithdrawalEvents({
      ledger: first.ledger, year: 2026, previousSlugs: ["one"], currentSlugs: ["one"],
      observedAt: "2026-08-18T00:00:00.000Z", lastSeenAt: "2026-08-17T00:00:00.000Z", programIsActive: true,
    });
    expect(second.appended).toEqual([]);
  });

  it("records reinstatement without deleting withdrawal history", () => {
    const withdrawn = reconcileWithdrawalEvents({
      ledger: emptyLedger(), year: 2026, previousSlugs: ["one"], currentSlugs: [],
      observedAt: "2026-08-17T00:00:00.000Z", lastSeenAt: "2026-08-16T00:00:00.000Z", programIsActive: true,
    }).ledger;
    const reinstated = reconcileWithdrawalEvents({
      ledger: withdrawn, year: 2026, previousSlugs: [], currentSlugs: ["one"],
      observedAt: "2026-08-18T00:00:00.000Z", lastSeenAt: "2026-08-17T00:00:00.000Z", programIsActive: true,
    });
    expect(reinstated.ledger.events.map((event) => event.event)).toEqual(["withdrawn", "reinstated"]);
    expect(withdrawnSlugsForYear(reinstated.ledger, 2026).size).toBe(0);
  });

  it("never records drift for a non-live program", () => {
    const result = reconcileWithdrawalEvents({
      ledger: emptyLedger(), year: 2025, previousSlugs: ["one"], currentSlugs: [],
      observedAt: "2026-08-17T00:00:00.000Z", lastSeenAt: "2026-08-16T00:00:00.000Z", programIsActive: false,
    });
    expect(result.appended).toEqual([]);
  });

  it("resolves Google slug suffix churn before comparison", () => {
    const resolve = createOrganizationIdentityResolver([{ slug: "jenkins", name: "Jenkins" }]);
    const previous = canonicalizeOrganizationSnapshot([{ slug: "jenkins", name: "Jenkins" }], resolve);
    const current = canonicalizeOrganizationSnapshot([{ slug: "jenkins-wp", name: "Jenkins" }], resolve);
    const result = reconcileWithdrawalEvents({
      ledger: emptyLedger(), year: 2026, previousSlugs: previous.keys(), currentSlugs: current.keys(),
      observedAt: "2026-08-17T00:00:00.000Z", lastSeenAt: "2026-08-16T00:00:00.000Z", programIsActive: true,
    });
    expect(result.appended).toEqual([]);
  });
});
