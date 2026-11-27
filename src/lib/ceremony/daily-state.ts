import { getWorkspaceStorage } from "@/lib/workspace/storage-mode";

const KEY = "riteflow.daily-discussed.v1";

type DailyStateMap = Record<string, string[]>;

function readAll(): DailyStateMap {
  const storage = getWorkspaceStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DailyStateMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: DailyStateMap) {
  const storage = getWorkspaceStorage();
  if (!storage) return;
  storage.setItem(KEY, JSON.stringify(map));
}

export function getDailyDiscussed(snapshotId: string): string[] {
  const entries = readAll()[snapshotId];
  return Array.isArray(entries) ? entries : [];
}

export function saveDailyDiscussed(snapshotId: string, keys: string[]) {
  const all = readAll();
  all[snapshotId] = [...new Set(keys)];
  writeAll(all);
}
