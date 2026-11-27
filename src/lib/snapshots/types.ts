import type { ReportPayload } from "@/lib/analytics/engine";

export type SystemMetrics = {
  unique: number;
  done: number;
  open: number;
  projects: number;
  qa: number;
  agingOpen: number;
  agingHeavy: number;
  bottleneck: number;
  bottleneckShare: number;
  carryoverRate: number;
  doneRate: number;
};

export type SprintSnapshot = {
  id: string;
  createdAt: string;
  label: string;
  sourceFiles: string[];
  metrics: SystemMetrics;
  payload: ReportPayload;
};

export type MetricKey = keyof SystemMetrics;
