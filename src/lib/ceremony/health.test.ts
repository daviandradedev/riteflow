import { describe, expect, it } from "vitest";
import { computeSprintHealth } from "@/lib/ceremony/health";
import { buildSprintBriefMarkdown } from "@/lib/ceremony/brief";
import { translations } from "@/lib/translations";
import type { SprintSnapshot } from "@/lib/snapshots/types";

function translatePt(key: string, params?: Record<string, string | number>): string {
  const parts = key.split(".");
  let current: unknown = translations.pt;
  for (const part of parts) {
    current = (current as Record<string, unknown> | undefined)?.[part];
  }
  let text = typeof current === "string" ? current : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

function makeSnapshot(overrides: Partial<SprintSnapshot["metrics"]> = {}): SprintSnapshot {
  const metrics = {
    unique: 20,
    done: 16,
    open: 4,
    projects: 2,
    qa: 3,
    agingOpen: 1,
    agingHeavy: 0,
    bottleneck: 1,
    bottleneckShare: 5,
    carryoverRate: 15,
    doneRate: 80,
    ...overrides,
  };
  return {
    id: "snap-1",
    createdAt: "2026-05-27T12:00:00.000Z",
    label: "13-05-2026 - 27-05-2026",
    sourceFiles: ["sprint.csv"],
    metrics,
    payload: {
      generatedAt: "2026-05-27T12:00:00.000Z",
      sourceFiles: ["sprint.csv"],
      cards: {
        unique: metrics.unique,
        done: metrics.done,
        open: metrics.open,
        projects: metrics.projects,
        qa: metrics.qa,
        agingOpen: metrics.agingOpen,
        agingHeavy: metrics.agingHeavy,
        bottleneck: metrics.bottleneck,
      },
      latest: [
        {
          title: "Unblock checkout deploy",
          assignee: "Davi",
          estimate: 3,
          status: "Aberta",
          board: "Review",
          project: "Core",
          sprints: "S1 | S2",
          link: "-",
          completedAt: "-",
          milestone: "13-05-2026 - 27-05-2026",
          milestoneOrder: 1,
          milestoneStart: null,
          milestoneEnd: null,
          sourceFile: "sprint.csv",
          isDone: false,
          isQa: false,
          carryoverSprints: 2,
          firstMilestone: "01-05-2026 - 12-05-2026",
          lastMilestone: "13-05-2026 - 27-05-2026",
          sprintHistoryCount: 2,
          agingSprints: 2,
          isBottleneck: true,
        },
      ],
      milestones: [],
      projectSummary: [],
      milestoneSummary: [],
      scopeSummary: [],
      agingItems: [],
      contributorMix: [],
      charts: {
        statusLabels: [],
        statusValues: [],
        boardLabels: [],
        boardValues: [],
        scopeLabels: [],
        scopeNew: [],
        scopeCarried: [],
        agingLabels: [],
        agingValues: [],
        projectLabels: [],
        projectTasks: [],
        projectQa: [],
        projectDone: [],
        projectOpen: [],
        milestoneLabels: [],
        milestoneDone: [14, 16],
        milestoneOpen: [4, 4],
      },
    },
  };
}

describe("computeSprintHealth", () => {
  it("classifies a healthy sprint with high score and positive action", () => {
    const result = computeSprintHealth(makeSnapshot());
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.status).toBe("healthy");
    expect(result.actions[0]?.key).toBe("health.actionHealthy");
  });

  it("classifies an overloaded sprint as critical with concrete actions", () => {
    const result = computeSprintHealth(
      makeSnapshot({
        doneRate: 35,
        carryoverRate: 60,
        bottleneckShare: 35,
        bottleneck: 7,
        agingOpen: 9,
        agingHeavy: 4,
      }),
    );
    expect(result.score).toBeLessThan(50);
    expect(result.status).toBe("critical");
    expect(result.actions.map((a) => a.key)).toEqual([
      "health.actionCarryover",
      "health.actionBottleneck",
      "health.actionAging",
    ]);
  });
});

describe("buildSprintBriefMarkdown", () => {
  it("consolidates health, daily progress, retro answers, planning target, and follow-ups", () => {
    const snap = makeSnapshot();
    const md = buildSprintBriefMarkdown({
      snapshot: snap,
      language: "pt",
      t: translatePt,
      discussedKeys: new Set(["Unblock checkout deploy::Davi::13-05-2026 - 27-05-2026"]),
      retroAnswers: {
        "question.system": "PRs grandes travaram na sexta-feira.",
      },
      hypotheses: [
        {
          id: "h1",
          title: "Limitar PRs a 300 linhas",
          metric: "bottleneckShare",
          direction: "down",
          baseline: 25,
          note: "Revisar diariamente às 10h",
          createdAt: "2026-05-15T10:00:00.000Z",
          sourceSnapshotId: "snap-0",
          status: "verified",
          verifiedValue: 5,
        },
      ],
      plannedNew: 10,
      avgThroughput: 15,
      doneDelta: 8,
      carryoverDelta: -10,
      bottleneckDelta: -12,
    });

    expect(md).toContain("13-05-2026 - 27-05-2026");
    expect(md).toContain("[x] **Unblock checkout deploy**");
    expect(md).toContain("PRs grandes travaram na sexta-feira.");
    expect(md).toContain("10");
    expect(md).toContain("Limitar PRs a 300 linhas");
    expect(md).toContain("25 → 5");
  });
});
