import type { Hypothesis } from "@/lib/loop/types";
import type { SprintSnapshot } from "@/lib/snapshots/types";

export const WORKSPACE_VERSION = 1 as const;

export type RetroAnswerMap = Record<string, Record<string, string>>;

export type WorkspacePayload = {
  version: typeof WORKSPACE_VERSION;
  updatedAt: string;
  snapshots: SprintSnapshot[];
  hypotheses: Hypothesis[];
  retroAnswers?: RetroAnswerMap;
  deletedSnapshotIds?: string[];
};

export function emptyWorkspace(): WorkspacePayload {
  return {
    version: WORKSPACE_VERSION,
    updatedAt: new Date(0).toISOString(),
    snapshots: [],
    hypotheses: [],
    retroAnswers: {},
    deletedSnapshotIds: [],
  };
}
