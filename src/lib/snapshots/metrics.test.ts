import { describe, expect, it } from "vitest";
import { systemMetricsFromReport } from "@/lib/snapshots/metrics";
import type { ReportPayload } from "@/lib/analytics/engine";

function stubReport(partial: Partial<ReportPayload["cards"]> & { scopeNew?: number[]; scopeCarried?: number[] }): ReportPayload {
  return {
    generatedAt: "2026-01-01T00:00:00.000Z",
    sourceFiles: ["sprint.csv"],
    cards: {
      unique: 10,
      done: 7,
      open: 3,
      projects: 2,
      qa: 1,
      agingOpen: 2,
      agingHeavy: 1,
      bottleneck: 2,
      ...partial,
    },
    charts: {
      statusLabels: [],
      statusValues: [],
      boardLabels: [],
      boardValues: [],
      scopeLabels: ["A"],
      scopeNew: partial.scopeNew ?? [6],
      scopeCarried: partial.scopeCarried ?? [4],
      agingLabels: [],
      agingValues: [],
      projectLabels: [],
      projectTasks: [],
      projectQa: [],
      projectDone: [],
      projectOpen: [],
      milestoneLabels: [],
      milestoneDone: [],
      milestoneOpen: [],
    },
    projectSummary: [],
    milestoneSummary: [],
    scopeSummary: [],
    agingItems: [],
    contributorMix: [],
    milestones: [],
    latest: [],
  };
}

describe("systemMetricsFromReport", () => {
  it("derives blameless system rates from a report", () => {
    const metrics = systemMetricsFromReport(stubReport({}));
    expect(metrics.doneRate).toBe(70);
    expect(metrics.bottleneckShare).toBe(20);
    expect(metrics.carryoverRate).toBe(40);
  });
});
