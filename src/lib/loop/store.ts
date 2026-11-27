import type { Hypothesis } from "@/lib/loop/types";
import type { SprintSnapshot } from "@/lib/snapshots/types";
import {
  getWorkspaceStorage,
  notifyWorkspaceMutation,
} from "@/lib/workspace/storage-mode";

const KEY = "riteflow.hypotheses.v1";
const EVENT = "riteflow-hypotheses";

let cache: Hypothesis[] | null = null;
let cacheStorage: Storage | null = null;

function readAll(): Hypothesis[] {
  const storage = getWorkspaceStorage();
  if (!storage) return [];
  if (cache && cacheStorage === storage) return cache;
  cacheStorage = storage;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) {
      cache = [];
      return cache;
    }
    const parsed = JSON.parse(raw) as Hypothesis[];
    cache = Array.isArray(parsed)
      ? [...parsed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

function writeAll(items: Hypothesis[], emitSync = true) {
  const storage = getWorkspaceStorage();
  cache = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  cacheStorage = storage;
  if (storage) {
    storage.setItem(KEY, JSON.stringify(cache));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
  if (emitSync) notifyWorkspaceMutation();
}

export function invalidateHypothesesCache() {
  cache = null;
  cacheStorage = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeHypotheses(onStoreChange: () => void) {
  const invalidate = () => {
    cache = null;
    cacheStorage = null;
    onStoreChange();
  };
  window.addEventListener("storage", invalidate);
  window.addEventListener(EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", invalidate);
    window.removeEventListener(EVENT, onStoreChange);
  };
}

export function listHypotheses(): Hypothesis[] {
  return readAll();
}

export function replaceHypotheses(items: Hypothesis[], emitSync = false) {
  writeAll(items.slice(0, 80), emitSync);
}

export function addHypothesis(
  input: Omit<Hypothesis, "id" | "createdAt" | "updatedAt" | "status">,
): Hypothesis {
  const now = new Date().toISOString();
  const item: Hypothesis = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "open",
  };
  writeAll([item, ...readAll()], true);
  return item;
}

export function dropHypothesis(id: string) {
  const now = new Date().toISOString();
  writeAll(
    readAll().map((item) =>
      item.id === id ? { ...item, status: "dropped", updatedAt: now } : item,
    ),
    true,
  );
}

export function reopenHypothesis(id: string) {
  const now = new Date().toISOString();
  writeAll(
    readAll().map((item) =>
      item.id === id
        ? {
            ...item,
            status: "open",
            updatedAt: now,
            verifiedAt: undefined,
            verifiedSnapshotId: undefined,
            verifiedValue: undefined,
          }
        : item,
    ),
    true,
  );
}

export function deleteHypothesis(id: string) {
  writeAll(
    readAll().filter((item) => item.id !== id),
    true,
  );
}

export type EvaluateResult = {
  evaluated: number;
  skippedSameSnapshot: number;
  hypotheses: Hypothesis[];
};

export function evaluateHypotheses(
  snapshot: SprintSnapshot,
  knownSnapshots: SprintSnapshot[] = listSnapshotsFromFallback(snapshot),
): EvaluateResult {
  const byId = new Map(knownSnapshots.map((item) => [item.id, item]));
  let evaluated = 0;
  let skippedSameSnapshot = 0;
  const now = new Date().toISOString();

  const next = readAll().map((item) => {
    if (item.status !== "open") return item;

    const source = byId.get(item.sourceSnapshotId);
    if (snapshot.id === item.sourceSnapshotId) {
      skippedSameSnapshot += 1;
      return item;
    }
    if (source && snapshot.createdAt <= source.createdAt) {
      skippedSameSnapshot += 1;
      return item;
    }
    if (!source && snapshot.createdAt <= item.createdAt) {
      skippedSameSnapshot += 1;
      return item;
    }

    const value = snapshot.metrics[item.metric];
    const ok = item.direction === "down" ? value < item.baseline : value > item.baseline;
    evaluated += 1;
    return {
      ...item,
      status: ok ? ("verified" as const) : ("missed" as const),
      updatedAt: now,
      verifiedAt: snapshot.createdAt,
      verifiedSnapshotId: snapshot.id,
      verifiedValue: value,
    };
  });

  writeAll(next, evaluated > 0);
  return { evaluated, skippedSameSnapshot, hypotheses: next };
}

function listSnapshotsFromFallback(snapshot: SprintSnapshot): SprintSnapshot[] {
  return [snapshot];
}
