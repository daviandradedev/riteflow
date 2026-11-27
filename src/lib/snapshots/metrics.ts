import type { ReportPayload } from "@/lib/analytics/engine";
import type { SystemMetrics } from "@/lib/snapshots/types";

export function systemMetricsFromReport(report: ReportPayload): SystemMetrics {
  const unique = report.cards.unique || 1;
  const newCount = report.charts.scopeNew.reduce((sum, n) => sum + n, 0);
  const carried = report.charts.scopeCarried.reduce((sum, n) => sum + n, 0);
  const scopeTotal = newCount + carried || 1;
  return {
    unique: report.cards.unique,
    done: report.cards.done,
    open: report.cards.open,
    projects: report.cards.projects,
    qa: report.cards.qa,
    agingOpen: report.cards.agingOpen,
    agingHeavy: report.cards.agingHeavy,
    bottleneck: report.cards.bottleneck,
    bottleneckShare: Number(((report.cards.bottleneck / unique) * 100).toFixed(1)),
    carryoverRate: Number(((carried / scopeTotal) * 100).toFixed(1)),
    doneRate: Number(((report.cards.done / unique) * 100).toFixed(1)),
  };
}
