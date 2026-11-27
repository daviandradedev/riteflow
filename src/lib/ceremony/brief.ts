import { displayBoard, displayProject } from "@/lib/analytics/display-labels";
import { computeSprintHealth } from "@/lib/ceremony/health";
import { dailyRiskItems, retroQuestions } from "@/lib/ceremony/signals";
import type { Hypothesis } from "@/lib/loop/types";
import type { SprintSnapshot } from "@/lib/snapshots/types";
import type { Language } from "@/lib/translations";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export type SprintBriefInput = {
  snapshot: SprintSnapshot;
  language: Language;
  t: TranslateFn;
  discussedKeys: Set<string>;
  retroAnswers: Record<string, string>;
  hypotheses: Hypothesis[];
  plannedNew: number | null;
  avgThroughput: number;
  doneDelta?: number | null;
  carryoverDelta?: number | null;
  bottleneckDelta?: number | null;
};

function riskItemKey(title: string, assignee: string, milestone: string) {
  return `${title}::${assignee}::${milestone}`;
}

export function buildSprintBriefMarkdown({
  snapshot,
  language,
  t,
  discussedKeys,
  retroAnswers,
  hypotheses,
  plannedNew,
  avgThroughput,
  doneDelta,
  carryoverDelta,
  bottleneckDelta,
}: SprintBriefInput): string {
  const health = computeSprintHealth(snapshot);
  const risks = dailyRiskItems(snapshot);
  const questions = retroQuestions(snapshot);
  const m = snapshot.metrics;
  const lines: string[] = [];

  lines.push(`# ${t("brief.docTitle")} — ${snapshot.label}`);
  lines.push("");
  lines.push(
    `**${t("health.score")}:** ${health.score}/100 (${t(`health.${health.status}`)}) · ${t("compare.policy")}`,
  );
  lines.push("");

  lines.push(`## ${t("brief.sectionHealth")}`);
  lines.push(`- **${t("metrics.doneRate")}:** ${m.doneRate}% (${m.done}/${m.unique})`);
  lines.push(`- **${t("metrics.carryoverRate")}:** ${m.carryoverRate}%`);
  lines.push(`- **${t("metrics.bottleneckShare")}:** ${m.bottleneckShare}% (${m.bottleneck})`);
  lines.push(`- **${t("metrics.agingOpen")}:** ${m.agingOpen} (${m.agingHeavy} ${t("metrics.agingHeavy")})`);
  if (doneDelta != null || carryoverDelta != null || bottleneckDelta != null) {
    const parts: string[] = [];
    if (doneDelta != null) parts.push(`${t("metrics.doneRate")} ${doneDelta > 0 ? `+${doneDelta}` : doneDelta}pp`);
    if (carryoverDelta != null) parts.push(`${t("metrics.carryoverRate")} ${carryoverDelta > 0 ? `+${carryoverDelta}` : carryoverDelta}pp`);
    if (bottleneckDelta != null) parts.push(`${t("metrics.bottleneckShare")} ${bottleneckDelta > 0 ? `+${bottleneckDelta}` : bottleneckDelta}pp`);
    lines.push(`- **${t("brief.sectionTrend")}:** ${parts.join(" · ")}`);
  }
  lines.push("");

  lines.push(`## ${t("brief.sectionActions")}`);
  for (const action of health.actions) {
    lines.push(`- ${t(action.key, action.params)}`);
  }
  lines.push("");

  lines.push(`## ${t("brief.sectionDaily")}`);
  if (risks.length === 0) {
    lines.push(`- ${t("daily.empty")}`);
  } else {
    const discussedCount = risks.filter((item) =>
      discussedKeys.has(riskItemKey(item.title, item.assignee, item.milestone)),
    ).length;
    lines.push(t("brief.discussedSummary", { done: discussedCount, total: risks.length }));
    for (const item of risks.slice(0, 8)) {
      const checked = discussedKeys.has(riskItemKey(item.title, item.assignee, item.milestone));
      lines.push(
        `- [${checked ? "x" : " "}] **${item.title}** — ${item.assignee} · ${displayProject(item.project, language)} · ${displayBoard(item.board, language)} (${item.agingSprints}x)`,
      );
    }
  }
  lines.push("");

  lines.push(`## ${t("brief.sectionRetro")}`);
  const answered = questions
    .map((key) => ({ question: t(key), answer: (retroAnswers[key] ?? "").trim() }))
    .filter((entry) => entry.answer.length > 0);
  if (answered.length === 0) {
    lines.push(`- ${t("brief.emptyRetro")}`);
  } else {
    for (const entry of answered) {
      lines.push(`- **${entry.question}**`);
      lines.push(`  ${entry.answer}`);
    }
  }
  lines.push("");

  lines.push(`## ${t("brief.sectionPlanning")}`);
  const suggestedNew = Math.max(0, Math.round(avgThroughput) - m.open);
  const chosenNew = plannedNew ?? suggestedNew;
  lines.push(`- **${t("planning.avgThroughput")}:** ${avgThroughput}`);
  lines.push(`- **${t("planning.open")}:** ${m.open} (${m.carryoverRate}% ${t("planning.inherited").toLowerCase()})`);
  lines.push(`- **${t("planning.suggestedCapacity")}:** ${suggestedNew}`);
  lines.push(`- **${t("planning.simulatorChosen")}:** ${chosenNew} (${t("planning.simulatorProjected", { total: m.open + chosenNew })})`);
  lines.push("");

  lines.push(`## ${t("brief.sectionLoop")}`);
  const relevant = hypotheses.filter((item) => item.status !== "dropped");
  if (relevant.length === 0) {
    lines.push(`- ${t("brief.emptyLoop")}`);
  } else {
    for (const item of relevant) {
      const statusLabel = t(`loop.${item.status}`);
      const delta = item.verifiedValue != null ? ` → ${item.verifiedValue}` : "";
      const note = item.note ? ` — ${item.note}` : "";
      lines.push(
        `- **[${statusLabel}]** ${item.title} (${t(`metrics.${item.metric}`)}: ${item.baseline}${delta})${note}`,
      );
    }
  }
  lines.push("");

  return lines.join("\n");
}
