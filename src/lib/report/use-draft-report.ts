"use client";

import { useSyncExternalStore } from "react";
import type { ReportPayload } from "@/lib/analytics/engine";
import { loadDraftReport, subscribeDraftReport } from "@/lib/report/draft";

const EMPTY: ReportPayload | null = null;

export function useDraftReport(): ReportPayload | null {
  return useSyncExternalStore(subscribeDraftReport, loadDraftReport, () => EMPTY);
}
