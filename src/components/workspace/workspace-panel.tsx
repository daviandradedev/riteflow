"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/contexts/language-context";
import { useHypotheses } from "@/lib/loop/use-hypotheses";
import { saveDraftReport } from "@/lib/report/draft";
import { deleteSnapshot } from "@/lib/snapshots/store";
import { useSnapshots } from "@/lib/snapshots/use-snapshots";
import { isWorkspacePayload, mergeWorkspaces } from "@/lib/workspace/merge";
import {
  downloadWorkspaceBackup,
  readLocalWorkspace,
  writeLocalWorkspace,
} from "@/lib/workspace/local";
import { syncWorkspace, type SyncStatus } from "@/lib/workspace/sync";

type Props = {
  signedIn: boolean;
  hasDraftReport?: boolean;
};

export function WorkspacePanel({ signedIn, hasDraftReport = false }: Props) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const snapshots = useSnapshots();
  const hypotheses = useHypotheses();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [busy, setBusy] = useState(false);

  const savedCount = snapshots.length;
  const followUpCount = hypotheses.length;
  const hasSavedData = savedCount > 0 || followUpCount > 0;

  async function handleImport(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!isWorkspacePayload(parsed)) {
        toast.error(t("workspace.invalid"));
        return;
      }
      const merged = mergeWorkspaces(readLocalWorkspace(), parsed);
      writeLocalWorkspace(merged, signedIn);
      toast.success(t("workspace.imported"));
    } catch {
      toast.error(t("workspace.invalid"));
    }
  }

  if (!hasSavedData && !hasDraftReport) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
        <p className="text-xs text-muted">{t("workspace.importHint")}</p>
        <button
          type="button"
          className="rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-foreground"
          onClick={() => inputRef.current?.click()}
        >
          {t("workspace.import")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) await handleImport(file);
          }}
        />
      </div>
    );
  }

  if (!hasSavedData && hasDraftReport) {
    return null;
  }

  return (
    <section className="box-border min-w-0 max-w-full overflow-hidden rounded-[1.5rem] border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-2xl">
          <h2 className="text-lg font-black text-foreground">{t("workspace.title")}</h2>
          <p className="mt-1 text-sm text-muted">{t("workspace.body")}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted">
            {t("workspace.summary", { sprints: savedCount, followUps: followUpCount })}
            {" · "}
            {signedIn ? t("workspace.onDeviceAndAccount") : t("workspace.onDevice")}
          </p>
        </div>
      </div>

      {snapshots.length > 0 ? (
        <div className="mt-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            {t("workspace.savedSprints")}
          </h3>
          <ul className="space-y-2">
            {snapshots.map((snap) => (
              <li
                key={snap.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{snap.label}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(snap.createdAt).toLocaleDateString(
                      language === "en" ? "en-US" : "pt-BR",
                    )}
                    {" · "}
                    {snap.metrics.done}/{snap.metrics.unique} {t("labels.done").toLowerCase()}
                    {" · "}
                    {snap.metrics.doneRate}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-foreground hover:bg-accent-soft"
                    onClick={() => {
                      saveDraftReport(snap.payload);
                      router.push("/report");
                    }}
                  >
                    <ExternalLink size={12} aria-hidden="true" />
                    {t("workspace.openReport")}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-danger-text"
                    aria-label={`${t("workspace.deleteSprint")} ${snap.label}`}
                    onClick={() => {
                      deleteSnapshot(snap.id);
                      toast.success(t("workspace.deletedSprint"));
                    }}
                  >
                    <Trash2 size={12} aria-hidden="true" />
                    {t("workspace.deleteSprint")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex max-w-full flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-surface-elevated"
          onClick={() => {
            downloadWorkspaceBackup();
            toast.success(t("workspace.exported"));
          }}
        >
          {t("workspace.export")}
        </button>
        <button
          type="button"
          className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-surface-elevated"
          onClick={() => inputRef.current?.click()}
        >
          {t("workspace.import")}
        </button>
        {signedIn ? (
          <button
            type="button"
            disabled={busy}
            className="rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover disabled:opacity-60"
            onClick={async () => {
              setBusy(true);
              setStatus("syncing");
              const next = await syncWorkspace();
              setStatus(next);
              setBusy(false);
              if (next === "synced") toast.success(t("workspace.synced"));
              else if (next === "local_only") toast.message(t("workspace.localOnly"));
              else if (next === "unauthorized") toast.error(t("workspace.signIn"));
              else toast.error(t("workspace.failed"));
            }}
          >
            {busy ? t("workspace.syncing") : t("workspace.sync")}
          </button>
        ) : null}
      </div>

      {status !== "idle" ? (
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-accent-text">
          {t(`workspace.status.${status}`)}
        </p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) await handleImport(file);
        }}
      />
    </section>
  );
}
