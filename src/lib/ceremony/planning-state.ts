import { getWorkspaceStorage } from "@/lib/workspace/storage-mode";

const KEY = "riteflow.planning-target.v1";

type PlanningTargetMap = Record<string, number>;

function readAll(): PlanningTargetMap {
  const storage = getWorkspaceStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PlanningTargetMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function getPlanningTarget(snapshotId: string): number | null {
  const value = readAll()[snapshotId];
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

export function setPlanningTarget(snapshotId: string, targetNew: number) {
  const storage = getWorkspaceStorage();
  if (!storage) return;
  const all = readAll();
  all[snapshotId] = Math.max(0, Math.round(targetNew));
  storage.setItem(KEY, JSON.stringify(all));
}
