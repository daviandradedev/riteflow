"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { CheckCircle2, Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { usePreferences } from "@/components/preferences";
import { StepFooter } from "@/components/shell/step-footer";
import { COLOR_CARRIED, COLOR_DONE, COLOR_OPEN } from "@/lib/colors";
import { getRetroAnswers } from "@/lib/ceremony/answers";
import { buildSprintBriefMarkdown } from "@/lib/ceremony/brief";
import { getDailyDiscussed } from "@/lib/ceremony/daily-state";
import { computeSprintHealth } from "@/lib/ceremony/health";
import { getPlanningTarget } from "@/lib/ceremony/planning-state";
import { dailyRiskItems, retroQuestions } from "@/lib/ceremony/signals";
import { useHypotheses } from "@/lib/loop/use-hypotheses";
import { deltaTone, formatMetricDelta, metricDelta } from "@/lib/snapshots/delta";
import { useActiveSnapshot, useSnapshots } from "@/lib/snapshots/use-snapshots";
import type { MetricKey, SystemMetrics } from "@/lib/snapshots/types";
import type { ReportPayload } from "@/lib/analytics/engine";
import { useLanguage } from "@/lib/contexts/language-context";

ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const METRICS: MetricKey[] = [
  "doneRate",
  "open",
  "agingOpen",
  "bottleneckShare",
  "carryoverRate",
  "unique",
];

type CompareEntry = {
  id: string;
  label: string;
  metrics: SystemMetrics;
};

function reportMilestonesToSeries(report: ReportPayload): CompareEntry[] {
  const scopeBySprint = new Map(
    report.scopeSummary.map((row) => [
      String(row.Sprint),
      {
        newCount: Number(row.New ?? 0),
        carried: Number(row.Carried ?? 0),
      },
    ]),
  );

  return [...report.milestones].reverse().map((ms) => {
    const items = ms.projects.flatMap((project) => project.items);
    const total = items.length || 1;
    const done = items.filter((item) => item.isDone).length;
    const openItems = items.filter((item) => !item.isDone);
    const agingOpen = openItems.filter(
      (item) => item.agingSprints > 1 || item.isBottleneck,
    ).length;
    const agingHeavy = openItems.filter((item) => item.agingSprints >= 3).length;
    const bottleneck = openItems.filter((item) => item.isBottleneck).length;
    const scope = scopeBySprint.get(ms.milestone) ?? { newCount: items.length, carried: 0 };
    const scopeTotal = scope.newCount + scope.carried || 1;

    return {
      id: ms.milestone,
      label: ms.milestone,
      metrics: {
        unique: items.length,
        done,
        open: openItems.length,
        projects: ms.projects.length,
        qa: items.filter((item) => item.isQa).length,
        agingOpen,
        agingHeavy,
        bottleneck,
        bottleneckShare: Number(((bottleneck / total) * 100).toFixed(1)),
        carryoverRate: Number(((scope.carried / scopeTotal) * 100).toFixed(1)),
        doneRate: Number(((done / total) * 100).toFixed(1)),
      },
    };
  });
}

export default function ComparePage() {
  const { t, language } = useLanguage();
  const lang = language === "en" ? "en" : "pt";
  const { theme } = usePreferences();
  const snapshots = useSnapshots();
  const hypotheses = useHypotheses();
  const { snapshot: activeSnapshot } = useActiveSnapshot();
  const [preferredMode, setPreferredMode] = useState<"report" | "history" | null>(null);

  const reportSeries = useMemo(
    () => (activeSnapshot ? reportMilestonesToSeries(activeSnapshot.payload) : []),
    [activeSnapshot],
  );
  const historySeries = useMemo<CompareEntry[]>(
    () =>
      [...snapshots]
        .reverse()
        .slice(-8)
        .map((snap) => ({
          id: snap.id,
          label: snap.label,
          metrics: snap.metrics,
        })),
    [snapshots],
  );

  const hasBoth = reportSeries.length >= 2 && historySeries.length >= 2;
  const activeMode: "report" | "history" =
    preferredMode === "history" && historySeries.length >= 2
      ? "history"
      : preferredMode === "report" && reportSeries.length >= 2
        ? "report"
        : historySeries.length >= 2
          ? "history"
          : "report";

  const series = activeMode === "history" ? historySeries : reportSeries;
  const isDark = theme === "dark";
  const tickColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.22)";

  const briefSummary = useMemo(() => {
    if (!activeSnapshot) return null;
    const health = computeSprintHealth(activeSnapshot);
    const risks = dailyRiskItems(activeSnapshot);
    const discussedKeys = new Set(getDailyDiscussed(activeSnapshot.id));
    const discussedCount = risks.filter((item) =>
      discussedKeys.has(`${item.title}::${item.assignee}::${item.milestone}`),
    ).length;
    const retroAnswers = getRetroAnswers(activeSnapshot.id);
    const questions = retroQuestions(activeSnapshot);
    const answeredRetro = questions
      .map((key) => ({ key, question: t(key), answer: (retroAnswers[key] ?? "").trim() }))
      .filter((entry) => entry.answer.length > 0);
    const perSprintDone = activeSnapshot.payload.charts.milestoneDone;
    const avgThroughput =
      perSprintDone.length > 0
        ? Math.round(
            (perSprintDone.reduce((sum, count) => sum + count, 0) / perSprintDone.length) * 10,
          ) / 10
        : activeSnapshot.metrics.done;
    const plannedNew = getPlanningTarget(activeSnapshot.id);
    const latestPair =
      series.length >= 2 ? { prev: series[series.length - 2]!, curr: series[series.length - 1]! } : null;
    const doneDelta = latestPair
      ? metricDelta(latestPair.prev.metrics.doneRate, latestPair.curr.metrics.doneRate)
      : null;
    const carryoverDelta = latestPair
      ? metricDelta(latestPair.prev.metrics.carryoverRate, latestPair.curr.metrics.carryoverRate)
      : null;
    const bottleneckDelta = latestPair
      ? metricDelta(latestPair.prev.metrics.bottleneckShare, latestPair.curr.metrics.bottleneckShare)
      : null;

    const markdown = buildSprintBriefMarkdown({
      snapshot: activeSnapshot,
      language: lang,
      t,
      discussedKeys,
      retroAnswers,
      hypotheses,
      plannedNew,
      avgThroughput,
      doneDelta,
      carryoverDelta,
      bottleneckDelta,
    });

    return {
      health,
      risksCount: risks.length,
      discussedCount,
      answeredRetro,
      plannedNew: plannedNew ?? Math.max(0, Math.round(avgThroughput) - activeSnapshot.metrics.open),
      activeHypotheses: hypotheses.filter((item) => item.status !== "dropped"),
      markdown,
    };
  }, [activeSnapshot, hypotheses, lang, series, t]);

  async function handleCopyBrief() {
    if (!briefSummary) return;
    try {
      await navigator.clipboard.writeText(briefSummary.markdown);
      toast.success(t("brief.copied"));
    } catch {
      toast.error(t("brief.copyFailed"));
    }
  }

  function handleDownloadBrief() {
    if (!briefSummary || !activeSnapshot) return;
    const blob = new Blob([briefSummary.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const slug = activeSnapshot.label.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    link.download = `riteflow-sprint-brief-${slug || "sprint"}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(t("brief.downloaded"));
  }

  return (
    <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t("brief.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t("brief.subtitle")}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-accent-text">
            {t("compare.policy")}
          </p>
        </div>

        {briefSummary ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleCopyBrief()}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover"
            >
              <Copy size={14} aria-hidden="true" />
              {t("brief.copyMarkdown")}
            </button>
            <button
              type="button"
              onClick={handleDownloadBrief}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-accent-soft"
            >
              <Download size={14} aria-hidden="true" />
              {t("brief.downloadMarkdown")}
            </button>
          </div>
        ) : null}
      </header>

      {briefSummary && activeSnapshot ? (
        <section
          aria-labelledby="sprint-brief-heading"
          className="rounded-[1.5rem] border border-border bg-surface-elevated p-5 space-y-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {activeSnapshot.label}
              </p>
              <h2
                id="sprint-brief-heading"
                className="mt-1 text-2xl font-black tabular-nums text-foreground"
              >
                {t("health.score")}: {briefSummary.health.score}/100 ·{" "}
                {t(`health.${briefSummary.health.status}`)}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link href="/report" className="rf-pill-mint inline-flex items-center gap-1">
                <CheckCircle2 size={12} aria-hidden="true" />
                {t("brief.checkData")}
              </Link>
              <Link
                href="/daily"
                className={briefSummary.discussedCount > 0 ? "rf-pill-mint" : "rf-pill"}
              >
                {t("brief.checkDaily", {
                  done: briefSummary.discussedCount,
                  total: briefSummary.risksCount,
                })}
              </Link>
              <Link
                href="/retro"
                className={briefSummary.answeredRetro.length > 0 ? "rf-pill-mint" : "rf-pill"}
              >
                {t("brief.checkRetro", { n: briefSummary.answeredRetro.length })}
              </Link>
              <Link
                href="/loop"
                className={briefSummary.activeHypotheses.length > 0 ? "rf-pill-mint" : "rf-pill"}
              >
                {t("brief.checkLoop", { n: briefSummary.activeHypotheses.length })}
              </Link>
              <Link href="/planning" className="rf-pill-indigo">
                {t("brief.checkPlanning", { n: briefSummary.plannedNew })}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("brief.sectionActions")}
              </h3>
              <ul className="space-y-1.5 text-sm text-foreground">
                {briefSummary.health.actions.map((action) => (
                  <li key={action.key} className="flex items-start gap-2">
                    <span aria-hidden="true" className="font-bold text-accent-text">
                      •
                    </span>
                    <span>{t(action.key, action.params)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("brief.sectionRetro")}
              </h3>
              {briefSummary.answeredRetro.length === 0 ? (
                <p className="text-sm text-muted">{t("brief.emptyRetro")}</p>
              ) : (
                <ul className="space-y-2 text-sm text-foreground">
                  {briefSummary.answeredRetro.map((entry) => (
                    <li key={entry.key}>
                      <p className="text-xs font-semibold text-muted">{entry.question}</p>
                      <p className="mt-0.5 leading-relaxed">{entry.answer}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                {t("brief.sectionLoop")}
              </h3>
              {briefSummary.activeHypotheses.length === 0 ? (
                <p className="text-sm text-muted">{t("brief.emptyLoop")}</p>
              ) : (
                <ul className="space-y-2 text-sm text-foreground">
                  {briefSummary.activeHypotheses.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-2">
                      <span className="font-medium">{item.title}</span>
                      <span
                        className={
                          item.status === "verified"
                            ? "rf-pill-mint shrink-0"
                            : item.status === "missed"
                              ? "rf-pill-danger shrink-0"
                              : "rf-pill-warn shrink-0"
                        }
                      >
                        {t(`loop.${item.status}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">{t("compare.title")}</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">{t("compare.body")}</p>
          </div>

          {hasBoth ? (
            <div
              className="inline-flex rounded-full border border-border bg-surface p-1"
              role="group"
              aria-label={t("compare.modeLabel")}
            >
              <button
                type="button"
                aria-pressed={activeMode === "report"}
                onClick={() => setPreferredMode("report")}
                className={
                  activeMode === "report"
                    ? "rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-accent-fg"
                    : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                }
              >
                {t("compare.sourceActiveReport")}
              </button>
              <button
                type="button"
                aria-pressed={activeMode === "history"}
                onClick={() => setPreferredMode("history")}
                className={
                  activeMode === "history"
                    ? "rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-accent-fg"
                    : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                }
              >
                {t("compare.sourceSavedSnapshots")}
              </button>
            </div>
          ) : null}
        </div>

        {series.length < 2 ? (
          <p className="rounded-[1.5rem] border border-dashed border-border p-6 text-sm text-muted">
            {t("compare.empty")}
          </p>
        ) : (
          <div className="space-y-6">
            <section className="rounded-[1.5rem] border border-border bg-surface-elevated p-4 sm:p-5">
              <h3 className="mb-3 text-sm font-bold text-foreground">{t("compare.trendTitle")}</h3>
              <div className="relative h-[240px]">
                <Bar
                  data={{
                    labels: series.map((entry) => entry.label.slice(0, 24)),
                    datasets: [
                      {
                        label: t("metrics.doneRate"),
                        data: series.map((entry) => entry.metrics.doneRate),
                        backgroundColor: COLOR_DONE,
                      },
                      {
                        label: t("metrics.carryoverRate"),
                        data: series.map((entry) => entry.metrics.carryoverRate),
                        backgroundColor: COLOR_CARRIED,
                      },
                      {
                        label: t("metrics.bottleneckShare"),
                        data: series.map((entry) => entry.metrics.bottleneckShare),
                        backgroundColor: COLOR_OPEN,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { ticks: { color: tickColor }, grid: { color: gridColor } },
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: tickColor },
                        grid: { color: gridColor },
                      },
                    },
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: tickColor },
                      },
                    },
                  }}
                />
              </div>
            </section>

            <div className="overflow-x-auto rounded-[1.5rem] border border-border bg-surface rf-step-indigo">
              <table className="sa-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>{t("compare.metric")}</th>
                    {series.map((entry) => (
                      <th key={entry.id}>{entry.label.slice(0, 28)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {METRICS.map((metric) => (
                    <tr key={metric}>
                      <td>{t(`metrics.${metric}`)}</td>
                      {series.map((entry, index) => {
                        const value = entry.metrics[metric];
                        const prev = index > 0 ? series[index - 1]!.metrics[metric] : null;
                        const delta = prev == null ? null : metricDelta(prev, value);
                        const tone = delta == null ? "flat" : deltaTone(metric, delta);
                        return (
                          <td key={`${entry.id}-${metric}`} className="num">
                            <span>{value}</span>
                            {delta != null ? (
                              <span
                                className={
                                  tone === "better"
                                    ? "ml-2 text-[11px] font-bold text-teal-700 dark:text-teal-300"
                                    : tone === "worse"
                                      ? "ml-2 text-[11px] font-bold text-red-700 dark:text-red-400"
                                      : "ml-2 text-[11px] font-bold text-muted"
                                }
                              >
                                {formatMetricDelta(delta)}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <StepFooter prev={{ href: "/planning", labelKey: "nav.planning" }} />
    </main>
  );
}
