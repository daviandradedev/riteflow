import type { Hypothesis } from "@/lib/loop/types";
import type { SprintSnapshot } from "@/lib/snapshots/types";
import type { RetroAnswerMap, WorkspacePayload } from "@/lib/workspace/types";
import { WORKSPACE_VERSION } from "@/lib/workspace/types";

export const MAX_SNAPSHOTS = 40;
export const MAX_HYPOTHESES = 80;
export const MAX_DELETED_IDS = 120;
export const MAX_WORKSPACE_BYTES = 2 * 1024 * 1024;

const VALID_HYPOTHESIS_STATUS = new Set(["open", "verified", "missed", "dropped"]);
const VALID_DIRECTIONS = new Set(["down", "up"]);

function newerIso(a: string, b: string) {
  return a.localeCompare(b) >= 0 ? a : b;
}

function effectiveTimestamp(item: { createdAt: string; updatedAt?: string; verifiedAt?: string }) {
  return item.updatedAt ?? item.verifiedAt ?? item.createdAt;
}

function mergeById<T extends { id: string; createdAt: string; updatedAt?: string; verifiedAt?: string }>(
  left: T[],
  right: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of [...left, ...right]) {
    const prev = map.get(item.id);
    if (!prev || effectiveTimestamp(item).localeCompare(effectiveTimestamp(prev)) >= 0) {
      map.set(item.id, item);
    }
  }
  return [...map.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function mergeRetroAnswers(
  older: RetroAnswerMap | undefined,
  newer: RetroAnswerMap | undefined,
): RetroAnswerMap {
  const out: RetroAnswerMap = {};
  const keys = new Set([...Object.keys(older ?? {}), ...Object.keys(newer ?? {})]);
  for (const snapId of keys) {
    out[snapId] = {
      ...(older?.[snapId] ?? {}),
      ...(newer?.[snapId] ?? {}),
    };
  }
  return out;
}

export function mergeWorkspaces(a: WorkspacePayload, b: WorkspacePayload): WorkspacePayload {
  const aIsNewer = a.updatedAt.localeCompare(b.updatedAt) >= 0;
  const deletedSet = new Set([
    ...(a.deletedSnapshotIds ?? []),
    ...(b.deletedSnapshotIds ?? []),
  ]);

  const snapshots = mergeById<SprintSnapshot>(a.snapshots, b.snapshots)
    .filter((snap) => !deletedSet.has(snap.id))
    .slice(0, MAX_SNAPSHOTS);

  const hypotheses = mergeById<Hypothesis>(a.hypotheses, b.hypotheses).slice(0, MAX_HYPOTHESES);

  const retroAnswers = mergeRetroAnswers(
    aIsNewer ? b.retroAnswers : a.retroAnswers,
    aIsNewer ? a.retroAnswers : b.retroAnswers,
  );

  return {
    version: WORKSPACE_VERSION,
    updatedAt: newerIso(a.updatedAt, b.updatedAt),
    snapshots,
    hypotheses,
    retroAnswers,
    deletedSnapshotIds: [...deletedSet].slice(-MAX_DELETED_IDS),
  };
}

function isValidSnapshot(value: unknown): value is SprintSnapshot {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    typeof row.createdAt === "string" &&
    typeof row.label === "string" &&
    Array.isArray(row.sourceFiles) &&
    Boolean(row.metrics && typeof row.metrics === "object") &&
    Boolean(row.payload && typeof row.payload === "object")
  );
}

function isValidHypothesis(value: unknown): value is Hypothesis {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    row.id.length > 0 &&
    typeof row.createdAt === "string" &&
    typeof row.title === "string" &&
    typeof row.metric === "string" &&
    typeof row.direction === "string" &&
    VALID_DIRECTIONS.has(row.direction) &&
    typeof row.baseline === "number" &&
    typeof row.status === "string" &&
    VALID_HYPOTHESIS_STATUS.has(row.status)
  );
}

function isValidRetroAnswers(value: unknown): value is RetroAnswerMap {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const entry of Object.values(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    for (const answer of Object.values(entry as Record<string, unknown>)) {
      if (typeof answer !== "string") return false;
    }
  }
  return true;
}

export function isWorkspacePayload(value: unknown): value is WorkspacePayload {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (row.version !== WORKSPACE_VERSION) return false;
  if (typeof row.updatedAt !== "string") return false;
  if (!Array.isArray(row.snapshots) || row.snapshots.length > MAX_SNAPSHOTS) return false;
  if (!Array.isArray(row.hypotheses) || row.hypotheses.length > MAX_HYPOTHESES) return false;
  if (!row.snapshots.every(isValidSnapshot)) return false;
  if (!row.hypotheses.every(isValidHypothesis)) return false;
  if (!isValidRetroAnswers(row.retroAnswers)) return false;
  if (
    row.deletedSnapshotIds !== undefined &&
    (!Array.isArray(row.deletedSnapshotIds) ||
      row.deletedSnapshotIds.length > MAX_DELETED_IDS ||
      !row.deletedSnapshotIds.every((id) => typeof id === "string"))
  ) {
    return false;
  }
  return true;
}
