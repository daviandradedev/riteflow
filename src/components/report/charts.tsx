"use client";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import type { ReportPayload } from "@/lib/analytics/engine";
import { usePreferences } from "@/components/preferences";
import { useLanguage } from "@/lib/contexts/language-context";
import {
  CHART_COLORS_SOLID,
  COLOR_AGING,
  COLOR_CARRIED,
  COLOR_DONE,
  COLOR_NEW,
  COLOR_OPEN,
} from "@/lib/colors";
import { displayBoard, displayProject, displayStatus } from "@/lib/analytics/display-labels";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

function ChartCard({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[16px] border border-[#d8e0e8] bg-white p-4 dark:border-border dark:bg-surface-elevated"
      data-chart-card
    >
      <h3 className="mb-3 text-sm font-bold text-[#1f2937] dark:text-foreground">{title}</h3>
      <div
        className="relative h-[220px] max-h-[280px] overflow-hidden sm:h-[280px]"
        data-chart-plot
      >
        {children}
      </div>
      {note ? <p className="mt-2 text-[11px] leading-relaxed text-muted">{note}</p> : null}
    </div>
  );
}

export function ReportCharts({ report }: { report: ReportPayload }) {
  const { t, language } = useLanguage();
  const { theme } = usePreferences();
  const lang = language === "en" ? "en" : "pt";
  const isDark = theme === "dark";
  const tickColor = isDark ? "#cbd5e1" : "#475569";
  const gridColor = isDark ? "rgba(148, 163, 184, 0.16)" : "rgba(148, 163, 184, 0.22)";
  const legendBottom = {
    position: "bottom" as const,
    labels: { color: tickColor },
  };
  const axisStyle = {
    ticks: { color: tickColor },
    grid: { color: gridColor },
  };
  const common = { responsive: true, maintainAspectRatio: false };
  const statusLabels = report.charts.statusLabels.map((label) => displayStatus(label, lang));
  const boardLabels = report.charts.boardLabels.map((label) => displayBoard(label, lang));
  const projectLabels = report.charts.projectLabels.map((label) => displayProject(label, lang));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartCard title={t("charts.status")}>
        <Doughnut
          data={{
            labels: statusLabels,
            datasets: [{ data: report.charts.statusValues, backgroundColor: CHART_COLORS_SOLID }],
          }}
          options={{ ...common, plugins: { legend: legendBottom } }}
        />
      </ChartCard>
      <ChartCard title={t("charts.board")}>
        <Doughnut
          data={{
            labels: boardLabels,
            datasets: [{ data: report.charts.boardValues, backgroundColor: CHART_COLORS_SOLID }],
          }}
          options={{ ...common, plugins: { legend: legendBottom } }}
        />
      </ChartCard>
      <ChartCard title={t("charts.scope")}>
        <Bar
          data={{
            labels: report.charts.scopeLabels,
            datasets: [
              { label: t("labels.new"), data: report.charts.scopeNew, backgroundColor: COLOR_NEW },
              {
                label: t("labels.carried"),
                data: report.charts.scopeCarried,
                backgroundColor: COLOR_CARRIED,
              },
            ],
          }}
          options={{
            ...common,
            scales: {
              x: { stacked: true, ...axisStyle },
              y: { stacked: true, beginAtZero: true, ...axisStyle },
            },
            plugins: { legend: legendBottom },
          }}
        />
      </ChartCard>
      <ChartCard title={t("charts.aging")}>
        <Bar
          data={{
            labels: report.charts.agingLabels.map((key) => t(`agingBuckets.${key}`)),
            datasets: [
              {
                label: t("cards.open"),
                data: report.charts.agingValues,
                backgroundColor: COLOR_AGING,
              },
            ],
          }}
          options={{
            ...common,
            scales: {
              x: axisStyle,
              y: { beginAtZero: true, ...axisStyle },
            },
            plugins: { legend: { display: false } },
          }}
        />
      </ChartCard>
      <ChartCard title={t("charts.projectSplit")}>
        <Bar
          data={{
            labels: projectLabels,
            datasets: [
              { label: t("labels.tasks"), data: report.charts.projectTasks, backgroundColor: COLOR_NEW },
              { label: t("labels.qa"), data: report.charts.projectQa, backgroundColor: COLOR_CARRIED },
            ],
          }}
          options={{
            ...common,
            indexAxis: "y",
            scales: {
              x: { stacked: true, beginAtZero: true, ...axisStyle },
              y: { stacked: true, ...axisStyle },
            },
            plugins: { legend: legendBottom },
          }}
        />
      </ChartCard>
      <ChartCard title={t("charts.projectDelivery")}>
        <Bar
          data={{
            labels: projectLabels,
            datasets: [
              { label: t("labels.done"), data: report.charts.projectDone, backgroundColor: COLOR_DONE },
              { label: t("labels.open"), data: report.charts.projectOpen, backgroundColor: COLOR_OPEN },
            ],
          }}
          options={{
            ...common,
            indexAxis: "y",
            scales: {
              x: { stacked: true, beginAtZero: true, ...axisStyle },
              y: { stacked: true, ...axisStyle },
            },
            plugins: { legend: legendBottom },
          }}
        />
      </ChartCard>
      <ChartCard title={t("charts.milestone")}>
        <Bar
          data={{
            labels: report.charts.milestoneLabels,
            datasets: [
              {
                label: t("labels.done"),
                data: report.charts.milestoneDone,
                backgroundColor: COLOR_DONE,
              },
              {
                label: t("labels.open"),
                data: report.charts.milestoneOpen,
                backgroundColor: COLOR_OPEN,
              },
            ],
          }}
          options={{
            ...common,
            scales: {
              x: { stacked: true, ...axisStyle },
              y: { stacked: true, beginAtZero: true, ...axisStyle },
            },
            plugins: { legend: legendBottom },
          }}
        />
      </ChartCard>
    </div>
  );
}
