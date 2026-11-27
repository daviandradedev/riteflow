"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/contexts/language-context";
import { parseUploadFiles } from "@/lib/analytics/parse";
import { analyzeReport, type ReportPayload } from "@/lib/analytics/engine";
import { loadSampleCsvFiles, SAMPLE_CSV_FILES } from "@/lib/samples";
import { cn } from "@/lib/utils";

type Props = {
  onReport: (report: ReportPayload) => void;
  onClear?: () => void;
  usedFileNames?: string[];
};

export function UploadZone({ onReport, onClear, usedFileNames = [] }: Props) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const usedKey = usedFileNames.join("|");

  useEffect(() => {
    if (files.length > 0 || usedKey.length === 0) return;
    const names = usedKey.split("|").filter(Boolean);
    let cancelled = false;
    void (async () => {
      try {
        const sampleFiles = await loadSampleCsvFiles();
        const wanted = new Set(names);
        const matched = sampleFiles.filter((file) => wanted.has(file.name));
        if (!cancelled && matched.length === names.length) {
          setFiles(matched);
        }
      } catch {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [files.length, usedKey]);

  async function run(nextFiles: File[]) {
    if (!nextFiles.length) {
      toast.error(t("errors.noFile"));
      return;
    }
    setLoading(true);
    try {
      const sources = await parseUploadFiles(nextFiles);
      const report = analyzeReport(sources);
      setFiles(nextFiles);
      onReport(report);
      toast.success(t("export.copied"));
    } catch (err) {
      const key = err instanceof Error ? err.message : "parse";
      const known = new Set(["parse", "columns", "empty", "pdfWeak", "noFile"]);
      toast.error(t(known.has(key) ? `errors.${key}` : "errors.parse"));
    } finally {
      setLoading(false);
    }
  }

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const incoming = Array.from(list);
    setFiles((prev) => {
      const byName = new Map(prev.map((f) => [f.name, f]));
      for (const file of incoming) byName.set(file.name, file);
      return [...byName.values()];
    });
  }

  async function loadSamples() {
    setLoading(true);
    try {
      const sampleFiles = await loadSampleCsvFiles();
      setFiles(sampleFiles);
      await run(sampleFiles);
      setFiles(sampleFiles);
    } catch {
      toast.error(t("errors.parse"));
      setLoading(false);
    }
  }

  const listedNames = files.length ? files.map((file) => file.name) : usedFileNames;

  return (
    <div className="grid gap-4 md:grid-cols-2 md:items-stretch md:gap-5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex h-full min-h-[16rem] flex-col justify-center rounded-3xl border-2 border-dashed p-6 text-center transition-colors sm:p-8",
          dragging ? "border-accent bg-accent-soft" : "border-border bg-surface"
        )}
      >
        <FileUp className="mx-auto mb-3 text-accent-text" size={28} />
        <p className="text-sm font-semibold text-foreground">{t("upload.drop")}</p>
        <p className="mt-1 text-xs text-muted">{t("upload.or")}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mx-auto mt-3 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover"
        >
          {t("upload.browse")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.pdf,text/csv,application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <p className="mt-4 text-xs text-muted">{t("upload.hint")}</p>
        <p className="mt-2 text-[11px] text-muted/80">{t("upload.columns")}</p>
      </div>

      <div className="flex min-h-[16rem] flex-col rounded-3xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
            {t("upload.selected", { n: listedNames.length })}
          </p>
          {listedNames.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                onClear?.();
              }}
              className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted hover:text-foreground"
            >
              {t("upload.clear")}
            </button>
          ) : null}
        </div>

        {listedNames.length > 0 ? (
          <ul className="upload-file-list custom-scrollbar mt-3 space-y-2 overflow-y-auto pr-1">
            {listedNames.map((name) => {
              const file = files.find((item) => item.name === name);
              return (
                <li
                  key={name}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm"
                >
                  <span className="truncate font-medium text-foreground">{name}</span>
                  {file ? (
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((item) => item !== file))}
                      className="rounded-md p-1 text-muted hover:bg-accent-soft"
                      aria-label={t("upload.clear")}
                    >
                      <X size={14} />
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-6 flex flex-1 items-center justify-center text-center text-sm text-muted">
            {t("upload.emptySelected")}
          </p>
        )}

        <div className="mt-auto flex flex-col gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            disabled={loading || !files.length}
            onClick={() => run(files)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-2.5 text-sm font-bold text-accent-fg hover:bg-accent-hover disabled:opacity-50 sm:w-auto"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : null}
            {loading ? t("upload.analyzing") : t("hero.cta")}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={loadSamples}
            className="w-full rounded-2xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-50 sm:w-auto"
          >
            {t("hero.sample", { n: SAMPLE_CSV_FILES.length })}
          </button>
          <p className="w-full text-xs text-muted">{t("upload.multiple")}</p>
        </div>
      </div>
    </div>
  );
}
