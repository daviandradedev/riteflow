import type { MetricKey } from "@/lib/snapshots/types";

export type HypothesisDirection = "down" | "up";

export type HypothesisStatus = "open" | "verified" | "missed" | "dropped";

export type Hypothesis = {
  id: string;
  createdAt: string;
  updatedAt?: string;
  title: string;
  metric: MetricKey;
  direction: HypothesisDirection;
  baseline: number;
  note: string;
  sourceSnapshotId: string;
  status: HypothesisStatus;
  verifiedAt?: string;
  verifiedSnapshotId?: string;
  verifiedValue?: number;
};
