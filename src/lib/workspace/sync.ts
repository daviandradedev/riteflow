import { isWorkspacePayload, mergeWorkspaces } from "@/lib/workspace/merge";
import { readLocalWorkspace, writeLocalWorkspace } from "@/lib/workspace/local";
import type { WorkspacePayload } from "@/lib/workspace/types";

export type SyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "local_only"
  | "unauthorized"
  | "error";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export async function pullAndMergeWorkspace(): Promise<{
  status: SyncStatus;
  workspace: WorkspacePayload;
}> {
  const local = readLocalWorkspace();
  const res = await fetch("/api/workspace", { method: "GET", credentials: "include" });
  if (res.status === 401) {
    return { status: "unauthorized", workspace: local };
  }
  if (res.status === 503) {
    return { status: "local_only", workspace: local };
  }
  if (!res.ok) {
    return { status: "error", workspace: local };
  }
  const data = (await res.json()) as { workspace: unknown };
  if (!data.workspace) {
    return { status: "synced", workspace: local };
  }
  if (!isWorkspacePayload(data.workspace)) {
    return { status: "error", workspace: local };
  }
  const merged = mergeWorkspaces(local, data.workspace);
  writeLocalWorkspace(merged, false);
  return { status: "synced", workspace: merged };
}

export async function pushWorkspace(workspace = readLocalWorkspace()): Promise<SyncStatus> {
  const stamped: WorkspacePayload = {
    ...workspace,
    updatedAt: new Date().toISOString(),
  };
  writeLocalWorkspace(stamped, false);
  const res = await fetch("/api/workspace", {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workspace: stamped }),
  });
  if (res.status === 401) return "unauthorized";
  if (res.status === 503) return "local_only";
  if (!res.ok) return "error";
  return "synced";
}

export async function syncWorkspace(): Promise<SyncStatus> {
  const pulled = await pullAndMergeWorkspace();
  if (
    pulled.status === "unauthorized" ||
    pulled.status === "local_only" ||
    pulled.status === "error"
  ) {
    return pulled.status;
  }
  return pushWorkspace(pulled.workspace);
}

export function scheduleWorkspacePush(delayMs = 800) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void pushWorkspace();
  }, delayMs);
}

export function cancelScheduledWorkspacePush() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
