import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReportPayload } from "@/lib/analytics/engine";

const memory = new Map<string, string>();

function stubReport(label: string): ReportPayload {
  return {
    generatedAt: "2026-01-01T00:00:00.000Z",
    sourceFiles: [label],
    cards: {
      unique: 10,
      done: 7,
      open: 3,
      projects: 2,
      qa: 1,
      agingOpen: 2,
      agingHeavy: 1,
      bottleneck: 2,
    },
    charts: {
      statusLabels: [],
      statusValues: [],
      boardLabels: [],
      boardValues: [],
      scopeLabels: ["A"],
      scopeNew: [6],
      scopeCarried: [4],
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

describe("snapshot store", () => {
  beforeEach(() => {
    memory.clear();
    vi.resetModules();
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
  });

  it("returns a stable list reference until writes", async () => {
    const { listSnapshots } = await import("@/lib/snapshots/store");
    const first = listSnapshots();
    const second = listSnapshots();
    expect(first).toBe(second);
  });

  it("saves and lists newest first", async () => {
    const { listSnapshots, saveSnapshotFromReport } = await import("@/lib/snapshots/store");
    saveSnapshotFromReport(stubReport("a.csv"), "A");
    saveSnapshotFromReport(stubReport("b.csv"), "B");
    const list = listSnapshots();
    expect(list).toHaveLength(2);
    expect(list[0]?.label).toBe("B");
    expect(listSnapshots()).toBe(list);
  });
});
