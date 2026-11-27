import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Hypothesis } from "@/lib/loop/types";
import type { SprintSnapshot } from "@/lib/snapshots/types";

const memory = new Map<string, string>();

vi.stubGlobal("localStorage", {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
});

vi.stubGlobal("window", {
  localStorage: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
  },
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => true,
});

function metrics(agingOpen: number) {
  return {
    unique: 10,
    done: 7,
    open: 3,
    projects: 2,
    qa: 1,
    agingOpen,
    agingHeavy: 0,
    bottleneck: 1,
    bottleneckShare: 10,
    carryoverRate: 20,
    doneRate: 70,
  };
}

function snap(id: string, createdAt: string, agingOpen: number): SprintSnapshot {
  return {
    id,
    createdAt,
    label: id,
    sourceFiles: [],
    metrics: metrics(agingOpen),
    payload: {} as SprintSnapshot["payload"],
  };
}

describe("evaluateHypotheses", () => {
  beforeEach(() => {
    memory.clear();
    vi.resetModules();
  });

  it("skips evaluation on the same source snapshot", async () => {
    const { replaceHypotheses, evaluateHypotheses } = await import("@/lib/loop/store");
    const source = snap("s1", "2026-01-01T00:00:00.000Z", 3);
    const open: Hypothesis = {
      id: "h1",
      createdAt: "2026-01-01T01:00:00.000Z",
      title: "Cut aging",
      metric: "agingOpen",
      direction: "down",
      baseline: 3,
      note: "",
      sourceSnapshotId: "s1",
      status: "open",
    };
    replaceHypotheses([open]);
    const result = evaluateHypotheses(source, [source]);
    expect(result.evaluated).toBe(0);
    expect(result.skippedSameSnapshot).toBe(1);
    expect(result.hypotheses[0]?.status).toBe("open");
  });

  it("verifies when a newer snapshot improves the metric", async () => {
    const { replaceHypotheses, evaluateHypotheses } = await import("@/lib/loop/store");
    const source = snap("s1", "2026-01-01T00:00:00.000Z", 3);
    const next = snap("s2", "2026-01-15T00:00:00.000Z", 1);
    replaceHypotheses([
      {
        id: "h1",
        createdAt: "2026-01-01T01:00:00.000Z",
        title: "Cut aging",
        metric: "agingOpen",
        direction: "down",
        baseline: 3,
        note: "",
        sourceSnapshotId: "s1",
        status: "open",
      },
    ]);
    const result = evaluateHypotheses(next, [source, next]);
    expect(result.evaluated).toBe(1);
    expect(result.hypotheses[0]?.status).toBe("verified");
    expect(result.hypotheses[0]?.verifiedValue).toBe(1);
  });
});
