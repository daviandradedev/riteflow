import { listRetroAnswers, replaceRetroAnswers } from "@/lib/ceremony/answers";
import { listHypotheses, replaceHypotheses } from "@/lib/loop/store";
import {
  listDeletedSnapshotIds,
  listSnapshots,
  replaceDeletedSnapshotIds,
  replaceSnapshots,
} from "@/lib/snapshots/store";
import type { WorkspacePayload } from "@/lib/workspace/types";
import { WORKSPACE_VERSION } from "@/lib/workspace/types";

export function readLocalWorkspace(): WorkspacePayload {
  return {
    version: WORKSPACE_VERSION,
    updatedAt: new Date().toISOString(),
    snapshots: listSnapshots(),
    hypotheses: listHypotheses(),
    retroAnswers: listRetroAnswers(),
    deletedSnapshotIds: listDeletedSnapshotIds(),
  };
}

export function writeLocalWorkspace(workspace: WorkspacePayload, emitSync = false) {
  replaceSnapshots(workspace.snapshots, emitSync);
  replaceHypotheses(workspace.hypotheses, emitSync);
  if (workspace.retroAnswers) {
    replaceRetroAnswers(workspace.retroAnswers, emitSync);
  }
  if (workspace.deletedSnapshotIds) {
    replaceDeletedSnapshotIds(workspace.deletedSnapshotIds);
  }
}

export function exportWorkspaceJson(): string {
  return JSON.stringify(readLocalWorkspace(), null, 2);
}

export function downloadWorkspaceBackup() {
  const blob = new Blob([exportWorkspaceJson()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `riteflow-workspace-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
