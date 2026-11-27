import type { ReportPayload } from "@/lib/analytics/engine";
import { systemMetricsFromReport } from "@/lib/snapshots/metrics";
import type { SprintSnapshot } from "@/lib/snapshots/types";
import {
  getWorkspaceStorage,
  notifyWorkspaceMutation,
} from "@/lib/workspace/storage-mode";

const KEY = "riteflow.snapshots.v1";
const DELETED_KEY = "riteflow.snapshots.deleted.v1";
const EVENT = "riteflow-snapshots";

let cache: SprintSnapshot[] | null = null;
let cacheStorage: Storage | null = null;

function readAll(): SprintSnapshot[] {
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
    const parsed = JSON.parse(raw) as SprintSnapshot[];
    cache = Array.isArray(parsed)
      ? [...parsed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

function writeAll(items: SprintSnapshot[], emitSync = true) {
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

export function listDeletedSnapshotIds(): string[] {
  const storage = getWorkspaceStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(DELETED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function replaceDeletedSnapshotIds(ids: string[]) {
  const storage = getWorkspaceStorage();
  if (!storage) return;
  storage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids)].slice(-120)));
}

export function invalidateSnapshotsCache() {
  cache = null;
  cacheStorage = null;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
}

export function subscribeSnapshots(onStoreChange: () => void) {
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

export function listSnapshots(): SprintSnapshot[] {
  return readAll();
}

export function replaceSnapshots(items: SprintSnapshot[], emitSync = false) {
  writeAll(items.slice(0, 40), emitSync);
}

export function getSnapshot(id: string): SprintSnapshot | null {
  return readAll().find((item) => item.id === id) ?? null;
}

export function buildSnapshotFromReport(
  report: ReportPayload,
  label?: string,
  id = `draft:${report.generatedAt}`,
): SprintSnapshot {
  return {
    id,
    createdAt: report.generatedAt,
    label: label?.trim() || report.sourceFiles.join(" · ") || "Sprint snapshot",
    sourceFiles: report.sourceFiles,
    metrics: systemMetricsFromReport(report),
    payload: report,
  };
}

export function saveSnapshotFromReport(report: ReportPayload, label?: string): SprintSnapshot {
  const snapshot: SprintSnapshot = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    label: label?.trim() || report.sourceFiles.join(" · ") || "Sprint snapshot",
    sourceFiles: report.sourceFiles,
    metrics: systemMetricsFromReport(report),
    payload: report,
  };
  const next = [snapshot, ...readAll().filter((item) => item.id !== snapshot.id)];
  writeAll(next.slice(0, 40), true);
  return snapshot;
}

export function deleteSnapshot(id: string) {
  replaceDeletedSnapshotIds([...listDeletedSnapshotIds(), id]);
  writeAll(
    readAll().filter((item) => item.id !== id),
    true,
  );
}

export function latestSnapshot(): SprintSnapshot | null {
  return listSnapshots()[0] ?? null;
}
