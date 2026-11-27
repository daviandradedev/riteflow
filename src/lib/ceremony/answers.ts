import type { RetroAnswerMap } from "@/lib/workspace/types";
import {
  getWorkspaceStorage,
  notifyWorkspaceMutation,
} from "@/lib/workspace/storage-mode";

const KEY = "riteflow.retro-answers.v1";
const EVENT = "riteflow-retro-answers";

function readAll(): RetroAnswerMap {
  const storage = getWorkspaceStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RetroAnswerMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: RetroAnswerMap, emitSync = true) {
  const storage = getWorkspaceStorage();
  if (storage) {
    storage.setItem(KEY, JSON.stringify(map));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT));
  }
  if (emitSync) notifyWorkspaceMutation();
}

export function listRetroAnswers(): RetroAnswerMap {
  return readAll();
}

export function replaceRetroAnswers(map: RetroAnswerMap, emitSync = false) {
  writeAll(map, emitSync);
}

export function getRetroAnswers(snapshotId: string): Record<string, string> {
  return readAll()[snapshotId] ?? {};
}

export function setRetroAnswer(snapshotId: string, questionKey: string, answer: string) {
  const all = readAll();
  const current = { ...(all[snapshotId] ?? {}) };
  if (answer.trim()) current[questionKey] = answer;
  else delete current[questionKey];
  all[snapshotId] = current;
  writeAll(all, true);
}
