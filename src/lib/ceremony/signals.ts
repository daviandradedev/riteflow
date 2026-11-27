import type { SprintSnapshot } from "@/lib/snapshots/types";
import type { AnalyzedItem } from "@/lib/analytics/engine";

export type EvidenceCard = {
  id: string;
  metric: string;
  value: string;
  tone: "ok" | "watch" | "risk";
};

export function evidenceCards(snapshot: SprintSnapshot): EvidenceCard[] {
  const m = snapshot.metrics;
  return [
    {
      id: "open",
      metric: "open",
      value: String(m.open),
      tone: m.open === 0 ? "ok" : "risk",
    },
    {
      id: "aging",
      metric: "agingOpen",
      value: String(m.agingOpen),
      tone: m.agingOpen === 0 ? "ok" : "risk",
    },
    {
      id: "bottleneck",
      metric: "bottleneckShare",
      value: `${m.bottleneckShare}%`,
      tone: m.bottleneckShare < 10 ? "ok" : m.bottleneckShare >= 25 ? "risk" : "watch",
    },
    {
      id: "carryover",
      metric: "carryoverRate",
      value: `${m.carryoverRate}%`,
      tone: m.carryoverRate < 30 ? "ok" : m.carryoverRate >= 55 ? "risk" : "watch",
    },
    {
      id: "doneRate",
      metric: "doneRate",
      value: `${m.doneRate}%`,
      tone: m.doneRate >= 75 ? "ok" : m.doneRate < 50 ? "risk" : "watch",
    },
    {
      id: "qa",
      metric: "qa",
      value: String(m.qa),
      tone: m.qa === 0 ? "ok" : m.qa >= 5 ? "watch" : "ok",
    },
  ];
}

export function retroQuestions(snapshot: SprintSnapshot): string[] {
  const cards = evidenceCards(snapshot);
  const risky = cards.filter((card) => card.tone === "risk").map((card) => card.metric);
  const questions = [
    "question.system",
    "question.keep",
  ];
  if (risky.includes("bottleneckShare")) questions.push("question.bottleneck");
  if (risky.includes("agingOpen")) questions.push("question.aging");
  if (risky.includes("carryoverRate")) questions.push("question.carryover");
  if (questions.length < 4) questions.push("question.experiment");
  return questions.slice(0, 5);
}

export function pickDailyRiskItems(items: AnalyzedItem[]): AnalyzedItem[] {
  return items
    .filter((item) => !item.isDone && (item.agingSprints > 1 || item.isBottleneck))
    .sort((a, b) => b.agingSprints - a.agingSprints || a.title.localeCompare(b.title))
    .slice(0, 20);
}

export function dailyRiskItems(snapshot: SprintSnapshot): AnalyzedItem[] {
  return pickDailyRiskItems(snapshot.payload.latest);
}

export function planningGuardrails(snapshot: SprintSnapshot) {
  const m = snapshot.metrics;
  return {
    inheritedLoad: m.carryoverRate,
    openRisk: m.open,
    bottleneckShare: m.bottleneckShare,
    warnOvercommit: m.carryoverRate >= 45 || m.bottleneckShare >= 25,
  };
}
