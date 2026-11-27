export type WorkspaceStorageMode = "account" | "visitor";

let mode: WorkspaceStorageMode = "account";
let onMutation: (() => void) | null = null;

export function setWorkspaceStorageMode(next: WorkspaceStorageMode) {
  mode = next;
}

export function getWorkspaceStorageMode(): WorkspaceStorageMode {
  return mode;
}

export function getWorkspaceStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  if (mode === "visitor" && window.sessionStorage) {
    return window.sessionStorage;
  }
  return window.localStorage ?? null;
}

export function registerWorkspaceMutationHandler(handler: (() => void) | null) {
  onMutation = handler;
}

export function notifyWorkspaceMutation() {
  if (mode === "account") {
    onMutation?.();
  }
}
