import type { MetricKey, SystemMetrics } from "@/lib/snapshots/types";

export function metricDelta(prev: number, next: number): number {
  return Math.round((next - prev) * 10) / 10;
}

export function formatMetricDelta(delta: number): string {
  if (delta === 0) return "0";
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export function deltaTone(
  metric: MetricKey,
  delta: number,
): "better" | "worse" | "flat" {
  if (delta === 0) return "flat";
  const lowerIsBetter: MetricKey[] = [
    "open",
    "agingOpen",
    "agingHeavy",
    "bottleneck",
    "bottleneckShare",
    "carryoverRate",
    "qa",
  ];
  const higherIsBetter: MetricKey[] = ["done", "doneRate"];
  if (lowerIsBetter.includes(metric)) return delta < 0 ? "better" : "worse";
  if (higherIsBetter.includes(metric)) return delta > 0 ? "better" : "worse";
  return "flat";
}

export function seriesDeltas(
  metrics: SystemMetrics[],
  key: MetricKey,
): Array<number | null> {
  return metrics.map((row, index) => {
    if (index === 0) return null;
    return metricDelta(metrics[index - 1]![key], row[key]);
  });
}
