"use client";

import { useEffect } from "react";
import { analyzeReport } from "@/lib/analytics/engine";
import { parseUploadFiles } from "@/lib/analytics/parse";
import {
  addHypothesis,
  invalidateHypothesesCache,
  listHypotheses,
} from "@/lib/loop/store";
import { loadDraftReport, saveDraftReport } from "@/lib/report/draft";
import { loadSampleCsvFiles } from "@/lib/samples";
import { systemMetricsFromReport } from "@/lib/snapshots/metrics";
import { invalidateSnapshotsCache, listSnapshots } from "@/lib/snapshots/store";
import {
  registerWorkspaceMutationHandler,
  setWorkspaceStorageMode,
} from "@/lib/workspace/storage-mode";
import {
  cancelScheduledWorkspacePush,
  scheduleWorkspacePush,
  syncWorkspace,
} from "@/lib/workspace/sync";

const VISITOR_SEED_KEY = "rf-visitor-seeded-v1";

export function WorkspaceSync({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    setWorkspaceStorageMode(enabled ? "account" : "visitor");
    invalidateSnapshotsCache();
    invalidateHypothesesCache();

    if (!enabled) {
      registerWorkspaceMutationHandler(null);
      cancelScheduledWorkspacePush();

      let cancelled = false;
      const alreadySeeded = sessionStorage.getItem(VISITOR_SEED_KEY) === "1";
      const hasData = Boolean(loadDraftReport()) || listSnapshots().length > 0;

      if (!alreadySeeded && !hasData) {
        sessionStorage.setItem(VISITOR_SEED_KEY, "1");
        void (async () => {
          try {
            const files = await loadSampleCsvFiles();
            const sources = await parseUploadFiles(files);
            const report = analyzeReport(sources);
            if (cancelled) return;
            saveDraftReport(report);
            if (listHypotheses().length === 0) {
              const metrics = systemMetricsFromReport(report);
              const isEn = document.documentElement.lang.toLowerCase().startsWith("en");
              addHypothesis({
                title: isEn
                  ? "Cap Review queue WIP to 2 items per day"
                  : "Limitar fila de revisão para no máximo 2 itens por dia",
                metric: "bottleneckShare",
                direction: "down",
                baseline: metrics.bottleneckShare,
                note: isEn
                  ? "Review open PRs before midday standup."
                  : "Revisar PRs abertos antes da daily do meio-dia.",
                sourceSnapshotId: `draft:${report.generatedAt}`,
              });
            }
          } catch {
            return;
          }
        })();
      }

      return () => {
        cancelled = true;
      };
    }

    registerWorkspaceMutationHandler(() => {
      scheduleWorkspacePush(800);
    });
    void syncWorkspace();

    return () => {
      registerWorkspaceMutationHandler(null);
      cancelScheduledWorkspacePush();
    };
  }, [enabled]);

  return null;
}
