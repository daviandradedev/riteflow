import type { ReportPayload } from "@/lib/analytics/engine";

const KEY = "riteflow.draft-report";
const EVENT = "riteflow:draft-report";

let cache: ReportPayload | null | undefined;

function readCache(): ReportPayload | null {
  if (cache !== undefined) return cache;
  if (typeof window === "undefined") {
    cache = null;
    return cache;
  }
  try {
    const raw = window.sessionStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ReportPayload) : null;
  } catch {
    cache = null;
  }
  return cache;
}

function writeCache(next: ReportPayload | null) {
  cache = next;
  if (typeof window === "undefined") return;
  if (next) window.sessionStorage.setItem(KEY, JSON.stringify(next));
  else window.sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function saveDraftReport(report: ReportPayload) {
  writeCache(report);
}

export function loadDraftReport(): ReportPayload | null {
  return readCache();
}

export function clearDraftReport() {
  writeCache(null);
}

export function subscribeDraftReport(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const notify = () => {
    cache = undefined;
    onStoreChange();
  };
  window.addEventListener(EVENT, notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener(EVENT, notify);
    window.removeEventListener("storage", notify);
  };
}
