"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { toast } from "sonner";
import type { ReportPayload } from "@/lib/analytics/engine";
import { useLanguage } from "@/lib/contexts/language-context";
import { ReportCharts } from "@/components/report/charts";
import { ReportTables } from "@/components/report/tables";
import { ContributorMix } from "@/components/report/contributor-mix";
import { DailyAgenda } from "@/components/ceremony/daily-agenda";
import { pickDailyRiskItems } from "@/lib/ceremony/signals";
import {
  exportCsv,
  exportHtmlFromDom,
  exportJson,
  exportPdfFromDom,
} from "@/lib/analytics/export";
import { saveSnapshotFromReport } from "@/lib/snapshots/store";
import { pushWorkspace } from "@/lib/workspace/sync";
import { redirectToAuthLogin } from "@/lib/login-redirect";
import { MetricCard, type MetricTint } from "@/components/ui/metric-card";
import {
  displayBoard,
  displayProject,
  displayStatus,
} from "@/lib/analytics/display-labels";

function openTint(open: number): MetricTint {
  return open === 0 ? "mint" : "danger";
}

function agingTint(aging: number): MetricTint {
  return aging === 0 ? "mint" : "danger";
}

function bottleneckTint(count: number, unique: number): MetricTint {
  const share = unique ? (count / unique) * 100 : 0;
  if (share < 10) return "mint";
  if (share >= 25) return "danger";
  return "warn";
}

export function ReportDashboard({
  report,
  signedIn = false,
}: {
  report: ReportPayload;
  signedIn?: boolean;
}) {
  const { t, language } = useLanguage();
  const lang = language === "en" ? "en" : "pt";
  const reportRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const dailyItems = useMemo(() => pickDailyRiskItems(report.latest), [report.latest]);

  async function handleExport(kind: "html" | "pdf" | "csv" | "json") {
    try {
      if (kind === "csv") {
        exportCsv(report);
      } else if (kind === "json") {
        exportJson(report);
      } else {
        const root = reportRef.current;
        if (!root) throw new Error("Report root missing");
        if (kind === "html") exportHtmlFromDom(root, t("brand"));
        else await exportPdfFromDom(root, language);
      }
      toast.success(t("export.success", { format: t(`export.${kind}`) }));
    } catch (err) {
      console.error(err);
      toast.error(t("export.failed", { format: t(`export.${kind}`) }));
    }
  }

  async function handleSaveSnapshot() {
    if (!signedIn) {
      redirectToAuthLogin();
      return;
    }
    setSaving(true);
    try {
      saveSnapshotFromReport(report);
      const status = await pushWorkspace();
      if (status === "synced" || status === "local_only") {
        toast.success(t("export.savedAccount"));
      } else {
        toast.success(t("export.saved"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("export.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div id="sprint-report" className="scroll-mt-28 space-y-6">
      <div className="space-y-3">
        <div className="min-w-0">
          <h2 className="text-xl font-black text-foreground">{t("report.title")}</h2>
          <p className="mt-1 text-xs text-muted">
            {new Date(report.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButton
            label={t("export.pdf")}
            onClick={() => handleExport("pdf")}
            tone="accent"
            primary
          />
          <ExportButton label={t("export.html")} onClick={() => handleExport("html")} tone="indigo" />
          <ExportButton label={t("export.csv")} onClick={() => handleExport("csv")} tone="indigo" />
          <ExportButton label={t("export.json")} onClick={() => handleExport("json")} tone="indigo" />
          {signedIn ? (
            <ExportButton
              label={saving ? t("export.saving") : t("export.saveSnapshot")}
              onClick={() => void handleSaveSnapshot()}
              tone="mint"
            />
          ) : (
            <button
              type="button"
              onClick={redirectToAuthLogin}
              className="inline-flex items-center justify-center rounded-full border border-border px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-foreground"
            >
              {t("export.saveNeedsLogin")}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          {signedIn ? t("export.historyHintSignedIn") : t("export.historyHintGuest")}
        </p>
      </div>

      <div ref={reportRef} id="sprint-report-export-root" className="space-y-6">
        <section className="rounded-3xl border border-border bg-surface-elevated p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            {t("report.sprintsAnalyzed")}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {[...report.milestones].reverse().map((ms) => (
              <li
                key={ms.milestone}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-foreground"
              >
                {ms.milestone}
              </li>
            ))}
          </ul>
          {report.sourceFiles.length ? (
            <p className="mt-3 break-words text-[11px] text-muted">
              {report.sourceFiles.join(" · ")}
            </p>
          ) : null}
        </section>

        <div
          data-export-hide
          className="rounded-3xl border p-4 sm:p-5"
          style={{
            background: "var(--callout-bg)",
            borderColor: "var(--callout-border)",
          }}
        >
          <p
            className="text-xs font-black uppercase tracking-widest"
            style={{ color: "var(--callout-title)" }}
          >
            {t("callout.title")}
          </p>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--callout-body)" }}>
            {t("callout.body")}
          </p>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-foreground">
          <p>
            <span className="text-muted">{t("cards.unique")}</span>{" "}
            <strong className="text-base font-black tabular-nums">{report.cards.unique}</strong>
          </p>
          <p>
            <span className="text-muted">{t("cards.projects")}</span>{" "}
            <strong className="text-base font-black tabular-nums">{report.cards.projects}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <MetricCard label={t("cards.done")} value={report.cards.done} tint="mint" />
          <MetricCard
            label={t("cards.open")}
            value={report.cards.open}
            tint={openTint(report.cards.open)}
          />
          <MetricCard label={t("cards.qa")} value={report.cards.qa} tint="slate" />
          <MetricCard
            label={t("cards.aging")}
            value={report.cards.agingOpen}
            hint={t("cards.agingHint", { n: report.cards.agingHeavy })}
            tint={agingTint(report.cards.agingOpen)}
          />
          <MetricCard
            label={t("cards.bottleneck")}
            value={report.cards.bottleneck}
            hint={t("cards.bottleneckHint")}
            tint={bottleneckTint(report.cards.bottleneck, report.cards.unique)}
          />
        </div>

        <section
          className="rounded-3xl border border-border bg-surface-elevated p-5 sm:p-6"
          aria-labelledby="report-daily-agenda"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl">
              <h3 id="report-daily-agenda" className="text-lg font-bold text-foreground">
                {t("daily.title")}
              </h3>
              <p className="mt-1 text-sm text-muted">{t("daily.fromReport")}</p>
            </div>
            <Link
              href="/daily"
              data-export-hide
              className="rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover"
            >
              {t("daily.openFull")}
            </Link>
          </div>
          <div className="mt-4">
            <DailyAgenda items={dailyItems} compact />
          </div>
        </section>

        <ContributorMix report={report} />
        <ReportCharts report={report} />
        <ReportTables report={report} />

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-foreground">{t("tables.detail")}</h3>
          {report.milestones.map((ms) => (
            <details
              key={ms.milestone}
              open
              className="overflow-hidden rounded-3xl border border-border bg-surface-elevated"
            >
              <summary className="cursor-pointer list-none px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-base text-foreground">{ms.milestone}</strong>
                  <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                    <Pill tone={1}>
                      {t("labels.tasks")}: {ms.stats.tasks}
                    </Pill>
                    <Pill tone={3}>
                      {t("labels.qa")}: {ms.stats.qa}
                    </Pill>
                    <Pill tone={0}>
                      {t("labels.done")}: {ms.stats.done}
                    </Pill>
                    <Pill tone={2}>
                      {t("labels.open")}: {ms.stats.open}
                    </Pill>
                    <Pill tone={1}>
                      {t("labels.aging")}: {ms.stats.aging}
                    </Pill>
                  </div>
                </div>
              </summary>
              <div className="space-y-4 border-t border-border-subtle px-5 py-4">
                {ms.projects.map((project) => (
                  <div key={project.project}>
                    <h4 className="rf-project-title mb-2 text-sm font-bold">
                      {displayProject(project.project, lang)}
                    </h4>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="sa-table min-w-[560px] sm:min-w-[720px]">
                        <thead>
                          <tr>
                            <th className="col-wide">{t("columns.title")}</th>
                            <th className="col-md">{t("columns.assignee")}</th>
                            <th className="col-sm">{t("columns.status")}</th>
                            <th className="col-md">{t("columns.board")}</th>
                            <th className="col-xs num">{t("columns.age")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...project.items]
                            .sort(
                              (a, b) =>
                                b.agingSprints - a.agingSprints ||
                                Number(a.isDone) - Number(b.isDone) ||
                                a.title.localeCompare(b.title),
                            )
                            .map((item) => {
                            const rowClass = item.isDone
                              ? "rf-row-done"
                              : item.agingSprints >= 3
                                ? "rf-row-age3"
                                : item.agingSprints === 2
                                  ? "rf-row-age2"
                                  : "rf-row-age1";
                            const ageTone =
                              item.agingSprints >= 3
                                ? "rf-age-3"
                                : item.agingSprints === 2
                                  ? "rf-age-2"
                                  : "rf-age-1";
                            return (
                              <tr
                                key={`${item.milestone}-${item.title}`}
                                className={rowClass}
                              >
                                <td className="col-wide" title={item.title}>
                                  {item.link.startsWith("http") ? (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="rf-task-link"
                                    >
                                      {item.title}
                                    </a>
                                  ) : (
                                    item.title
                                  )}
                                </td>
                                <td className="col-md">{item.assignee}</td>
                                <td className="col-sm">{displayStatus(item.status, lang)}</td>
                                <td className="col-md">{displayBoard(item.board, lang)}</td>
                                <td className="col-xs num">
                                  <span className={`rf-age-badge ${ageTone}`}>
                                    {item.agingSprints}x
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </section>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode; tone?: number }) {
  return <span className="rf-pill">{children}</span>;
}

function ExportButton({
  label,
  onClick,
  tone,
  primary = false,
}: {
  label: string;
  onClick: () => void;
  tone: "accent" | "indigo" | "violet" | "mint" | "cyan";
  primary?: boolean;
}) {
  const tones = {
    accent: "bg-accent text-accent-fg hover:bg-accent-hover",
    indigo: "bg-accent-soft text-accent border border-accent-border hover:opacity-90",
    violet: "bg-violet-600 text-white hover:bg-violet-500",
    mint: "bg-emerald-600 text-white hover:bg-emerald-500",
    cyan: "bg-cyan-600 text-white hover:bg-cyan-500",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider ${tones[tone]} ${
        primary ? "shadow-sm" : "opacity-95"
      }`}
    >
      <Download size={14} strokeWidth={2.5} aria-hidden="true" />
      {label}
    </button>
  );
}
