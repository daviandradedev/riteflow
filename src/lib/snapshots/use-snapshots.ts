"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useDraftReport } from "@/lib/report/use-draft-report";
import {
  buildSnapshotFromReport,
  listSnapshots,
  subscribeSnapshots,
} from "@/lib/snapshots/store";
import type { SprintSnapshot } from "@/lib/snapshots/types";

const EMPTY: SprintSnapshot[] = [];

export function useSnapshots() {
  return useSyncExternalStore(subscribeSnapshots, listSnapshots, () => EMPTY);
}

export function useLatestSnapshot() {
  return useSnapshots()[0] ?? null;
}

export function useActiveSnapshot(): {
  snapshot: SprintSnapshot | null;
  isDraft: boolean;
} {
  const latest = useLatestSnapshot();
  const draft = useDraftReport();

  return useMemo(() => {
    if (draft) {
      if (!latest || draft.generatedAt.localeCompare(latest.payload.generatedAt) > 0) {
        return {
          snapshot: buildSnapshotFromReport(draft),
          isDraft: true,
        };
      }
    }
    return {
      snapshot: latest,
      isDraft: false,
    };
  }, [draft, latest]);
}
