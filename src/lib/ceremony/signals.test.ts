import { describe, expect, it } from "vitest";
import { evidenceCards, retroQuestions } from "@/lib/ceremony/signals";
import type { SprintSnapshot } from "@/lib/snapshots/types";

const snapshot = {
  id: "1",
  createdAt: "2026-01-01T00:00:00.000Z",
  label: "Demo",
  sourceFiles: ["a.csv"],
  metrics: {
    unique: 10,
    done: 4,
    open: 6,
    projects: 2,
    qa: 2,
    agingOpen: 4,
    agingHeavy: 2,
    bottleneck: 3,
    bottleneckShare: 30,
    carryoverRate: 60,
    doneRate: 40,
  },
  payload: {
    generatedAt: "",
    sourceFiles: [],
    cards: {
      unique: 10,
      done: 4,
      open: 6,
      projects: 2,
      qa: 2,
      agingOpen: 4,
      agingHeavy: 2,
      bottleneck: 3,
    },
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
  },
} satisfies SprintSnapshot;

describe("ceremony signals", () => {
  it("marks high bottleneck and aging as risk", () => {
    const cards = evidenceCards(snapshot);
    expect(cards.find((card) => card.id === "bottleneck")?.tone).toBe("risk");
    expect(cards.find((card) => card.id === "aging")?.tone).toBe("risk");
  });

  it("asks bottleneck and aging questions when those signals are risky", () => {
    const questions = retroQuestions(snapshot);
    expect(questions).toContain("question.bottleneck");
    expect(questions).toContain("question.aging");
  });
});
