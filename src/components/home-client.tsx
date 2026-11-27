"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ParsedSource, ReportPayload } from "@/lib/analytics/engine";
import { analyzeReport } from "@/lib/analytics/engine";
import { useLanguage } from "@/lib/contexts/language-context";
import { ManualEditor } from "@/components/manual-editor";
import { StepFooter } from "@/components/shell/step-footer";
import { UploadZone } from "@/components/upload-zone";
import { WorkspacePanel } from "@/components/workspace/workspace-panel";
import { clearDraftReport, saveDraftReport } from "@/lib/report/draft";
import { useDraftReport } from "@/lib/report/use-draft-report";

export function HomeClient({ signedIn = false }: { signedIn?: boolean }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [sources, setSources] = useState<ParsedSource[]>([]);
  const report = useDraftReport();

  function goToReport(next: ReportPayload) {
    saveDraftReport(next);
    router.push("/report");
  }

  function publish(nextSources: ParsedSource[]) {
    setSources(nextSources);
    if (!nextSources.length) {
      clearDraftReport();
      return;
    }
    try {
      goToReport(analyzeReport(nextSources));
    } catch {
      toast.error(t("errors.empty"));
    }
  }

  function showReport(next: ReportPayload) {
    setSources([]);
    goToReport(next);
  }

  return (
    <main id="main-content" className="site-main space-y-6 sm:space-y-8" tabIndex={-1}>
      <section className="min-w-0 rounded-[1.5rem] border border-border bg-surface-elevated/85 p-4 shadow-sm backdrop-blur sm:rounded-[2rem] sm:p-6 md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
          {t("evidence.intro.eyebrow")}
        </p>
        <h1 className="mt-2 max-w-3xl text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {t("evidence.intro.title")}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:mt-4 sm:text-base">
          {t("evidence.intro.body")}
        </p>
        <p className="mt-3 max-w-3xl text-sm font-semibold text-foreground">
          {t("evidence.intro.flow")}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(
            [
              ["evidence.intro.deliverable1Title", "evidence.intro.deliverable1Body"],
              ["evidence.intro.deliverable2Title", "evidence.intro.deliverable2Body"],
              ["evidence.intro.deliverable3Title", "evidence.intro.deliverable3Body"],
            ] as const
          ).map(([titleKey, bodyKey], index) => (
            <div
              key={titleKey}
              className="rounded-2xl border border-border bg-surface p-3.5"
            >
              <p className="text-[11px] font-bold uppercase tracking-wider text-accent-text">
                0{index + 1} · {t(titleKey)}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{t(bodyKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="min-w-0 rounded-[1.5rem] border border-border bg-surface-elevated/85 p-4 shadow-sm backdrop-blur sm:rounded-[2rem] sm:p-6 md:p-10">
        <div className="min-w-0">
          <h2 className="max-w-3xl text-xl font-black tracking-tight text-foreground sm:text-2xl">
            {t("hero.title")}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            {t("hero.subtitle")}
          </p>
        </div>
        <div className="mt-6 sm:mt-8">
          <UploadZone
            onReport={showReport}
            onClear={() => publish([])}
            usedFileNames={report?.sourceFiles ?? []}
          />
        </div>
      </section>

      <ManualEditor
        onApply={(source) => {
          publish([...sources.filter((item) => item.fileName !== source.fileName), source]);
        }}
      />

      <WorkspacePanel signedIn={signedIn} hasDraftReport={Boolean(report)} />

      {report ? (
        <StepFooter
          next={{ href: "/report", labelKey: "nav.report" }}
          hint={t("stepFooter.evidenceHint")}
        />
      ) : null}
    </main>
  );
}
