import type { SprintSnapshot } from "@/lib/snapshots/types";

export type HealthStatus = "healthy" | "watch" | "critical";

export type HealthActionKey =
  | "health.actionCarryover"
  | "health.actionBottleneck"
  | "health.actionAging"
  | "health.actionLowDone"
  | "health.actionHealthy";

export type HealthAction = {
  key: HealthActionKey;
  params?: Record<string, string | number>;
  severity: "risk" | "watch" | "ok";
};

export type SprintHealth = {
  score: number;
  status: HealthStatus;
  actions: HealthAction[];
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function computeSprintHealth(snapshot: SprintSnapshot): SprintHealth {
  const m = snapshot.metrics;
  const unique = Math.max(1, m.unique);
  const agingShare = (m.agingOpen / unique) * 100;

  const deliveryPart = clamp(m.doneRate, 0, 100) * 0.35;
  const carryoverPart = clamp(100 - m.carryoverRate, 0, 100) * 0.25;
  const bottleneckPart = clamp(100 - m.bottleneckShare * 2, 0, 100) * 0.25;
  const agingPart = clamp(100 - agingShare * 2, 0, 100) * 0.15;

  const score = Math.round(clamp(deliveryPart + carryoverPart + bottleneckPart + agingPart, 0, 100));
  const status: HealthStatus =
    score >= 75 ? "healthy" : score >= 50 ? "watch" : "critical";

  const actions: HealthAction[] = [];

  if (m.carryoverRate >= 40) {
    actions.push({
      key: "health.actionCarryover",
      params: { rate: m.carryoverRate },
      severity: m.carryoverRate >= 55 ? "risk" : "watch",
    });
  }

  if (m.bottleneckShare >= 20) {
    actions.push({
      key: "health.actionBottleneck",
      params: { rate: m.bottleneckShare, count: m.bottleneck },
      severity: m.bottleneckShare >= 30 ? "risk" : "watch",
    });
  }

  if (m.agingHeavy > 0) {
    actions.push({
      key: "health.actionAging",
      params: { count: m.agingHeavy },
      severity: "risk",
    });
  } else if (m.doneRate < 55) {
    actions.push({
      key: "health.actionLowDone",
      params: { rate: m.doneRate },
      severity: "watch",
    });
  }

  if (actions.length === 0) {
    actions.push({
      key: "health.actionHealthy",
      severity: "ok",
    });
  }

  return {
    score,
    status,
    actions: actions.slice(0, 3),
  };
}
