import { describe, expect, it } from "vitest";
import { isWorkspacePayload, MAX_SNAPSHOTS, mergeWorkspaces } from "@/lib/workspace/merge";
import type { SprintSnapshot } from "@/lib/snapshots/types";
import type { WorkspacePayload } from "@/lib/workspace/types";

function makeSnapshot(id: string, createdAt: string, label: string): SprintSnapshot {
  return {
    id,
    createdAt,
    label,
    sourceFiles: [],
    metrics: {
      unique: 2,
      done: 1,
      open: 1,
      projects: 1,
      qa: 0,
      agingOpen: 0,
      agingHeavy: 0,
      bottleneck: 0,
      bottleneckShare: 0,
      carryoverRate: 0,
      doneRate: 50,
    },
    payload: {} as never,
  };
}

function workspace(
  updatedAt: string,
  snapshots: WorkspacePayload["snapshots"],
  hypotheses: WorkspacePayload["hypotheses"] = [],
  extras: Partial<WorkspacePayload> = {},
): WorkspacePayload {
  return { version: 1, updatedAt, snapshots, hypotheses, ...extras };
}

describe("mergeWorkspaces", () => {
  it("unions snapshots by id and keeps newest createdAt", () => {
    const a = workspace("2026-01-02T00:00:00.000Z", [
      makeSnapshot("1", "2026-01-01T00:00:00.000Z", "old"),
    ]);
    const b = workspace("2026-01-03T00:00:00.000Z", [
      makeSnapshot("1", "2026-01-02T00:00:00.000Z", "new"),
      makeSnapshot("2", "2026-01-03T00:00:00.000Z", "extra"),
    ]);

    const merged = mergeWorkspaces(a, b);
    expect(merged.snapshots).toHaveLength(2);
    expect(merged.snapshots[0]?.id).toBe("2");
    expect(merged.snapshots.find((s) => s.id === "1")?.label).toBe("new");
    expect(merged.updatedAt).toBe("2026-01-03T00:00:00.000Z");
  });

  it("prefers updated or verified hypotheses over stale open copies", () => {
    const openCopy = {
      id: "h-1",
      createdAt: "2026-02-01T00:00:00.000Z",
      title: "Reduce review queue",
      metric: "bottleneckShare" as const,
      direction: "down" as const,
      baseline: 30,
      note: "",
      sourceSnapshotId: "s-1",
      status: "open" as const,
    };
    const verifiedCopy = {
      ...openCopy,
      status: "verified" as const,
      updatedAt: "2026-02-15T12:00:00.000Z",
      verifiedAt: "2026-02-15T12:00:00.000Z",
      verifiedSnapshotId: "s-2",
      verifiedValue: 10,
    };

    const mergedForward = mergeWorkspaces(
      workspace("2026-02-15T12:00:00.000Z", [], [verifiedCopy]),
      workspace("2026-02-10T00:00:00.000Z", [], [openCopy]),
    );
    expect(mergedForward.hypotheses[0]?.status).toBe("verified");
    expect(mergedForward.hypotheses[0]?.verifiedValue).toBe(10);

    const mergedReverse = mergeWorkspaces(
      workspace("2026-02-10T00:00:00.000Z", [], [openCopy]),
      workspace("2026-02-15T12:00:00.000Z", [], [verifiedCopy]),
    );
    expect(mergedReverse.hypotheses[0]?.status).toBe("verified");
  });

  it("respects deletedSnapshotIds tombstones and prevents resurrection", () => {
    const local = workspace("2026-03-02T00:00:00.000Z", [], [], {
      deletedSnapshotIds: ["s-old"],
    });
    const remote = workspace("2026-03-01T00:00:00.000Z", [
      makeSnapshot("s-old", "2026-02-20T00:00:00.000Z", "deleted one"),
      makeSnapshot("s-keep", "2026-03-01T00:00:00.000Z", "active one"),
    ]);

    const merged = mergeWorkspaces(local, remote);
    expect(merged.snapshots.map((s) => s.id)).toEqual(["s-keep"]);
    expect(merged.deletedSnapshotIds).toContain("s-old");
  });

  it("merges retro answers preferring the newer workspace for conflicting keys", () => {
    const older = workspace("2026-03-01T00:00:00.000Z", [], [], {
      retroAnswers: {
        "s-1": {
          "question.system": "old answer",
          "question.keep": "keep pairing",
        },
      },
    });
    const newer = workspace("2026-03-02T00:00:00.000Z", [], [], {
      retroAnswers: {
        "s-1": {
          "question.system": "updated answer",
        },
      },
    });

    const merged = mergeWorkspaces(older, newer);
    expect(merged.retroAnswers?.["s-1"]).toEqual({
      "question.system": "updated answer",
      "question.keep": "keep pairing",
    });
  });
});

describe("isWorkspacePayload", () => {
  it("accepts valid payloads and rejects malformed or oversized payloads", () => {
    const valid = workspace("2026-03-01T00:00:00.000Z", [
      makeSnapshot("s-1", "2026-03-01T00:00:00.000Z", "Sprint 1"),
    ]);
    expect(isWorkspacePayload(valid)).toBe(true);
    expect(isWorkspacePayload(null)).toBe(false);
    expect(isWorkspacePayload({ ...valid, version: 99 })).toBe(false);
    expect(isWorkspacePayload({ ...valid, snapshots: [{ id: "" }] })).toBe(false);
    expect(
      isWorkspacePayload({
        ...valid,
        snapshots: Array.from({ length: MAX_SNAPSHOTS + 1 }, (_, i) =>
          makeSnapshot(`s-${i}`, "2026-03-01T00:00:00.000Z", `Sprint ${i}`),
        ),
      }),
    ).toBe(false);
    expect(
      isWorkspacePayload({
        ...valid,
        retroAnswers: { "s-1": { q: 123 } },
      }),
    ).toBe(false);
  });
});
