"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { NeedsSnapshot } from "@/components/ceremony/needs-snapshot";
import { DailyAgenda } from "@/components/ceremony/daily-agenda";
import { StepFooter } from "@/components/shell/step-footer";
import { MetricCard } from "@/components/ui/metric-card";
import { getPlanningTarget, setPlanningTarget } from "@/lib/ceremony/planning-state";
import { dailyRiskItems, planningGuardrails } from "@/lib/ceremony/signals";
import { useHypotheses } from "@/lib/loop/use-hypotheses";
import { useActiveSnapshot } from "@/lib/snapshots/use-snapshots";
import type { SprintSnapshot } from "@/lib/snapshots/types";
import { useLanguage } from "@/lib/contexts/language-context";

export default function PlanningPage() {
  const { t } = useLanguage();
  const { snapshot, isDraft } = useActiveSnapshot();

  if (!snapshot) {
    return (
      <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
        <h1 className="text-3xl font-black text-foreground">{t("planning.title")}</h1>
        <NeedsSnapshot />
      </main>
    );
  }

  return <PlanningWithSnapshot key={snapshot.id} snapshot={snapshot} isDraft={isDraft} />;
}

function PlanningWithSnapshot({
  snapshot,
  isDraft,
}: {
  snapshot: SprintSnapshot;
  isDraft: boolean;
}) {
  const { t } = useLanguage();
  const hypotheses = useHypotheses();
  const guardrails = useMemo(() => planningGuardrails(snapshot), [snapshot]);
  const carriedItems = useMemo(() => dailyRiskItems(snapshot), [snapshot]);

  const throughput = useMemo(() => {
    const perSprintDone = snapshot.payload.charts.milestoneDone;
    const sprintCount = Math.max(1, perSprintDone.length);
    const avgDone =
      perSprintDone.length > 0
        ? Math.round(
            (perSprintDone.reduce((sum, count) => sum + count, 0) / sprintCount) * 10,
          ) / 10
        : snapshot.metrics.done;
    const suggestedNew = Math.max(0, Math.round(avgDone) - snapshot.metrics.open);
    return { sprintCount, avgDone, suggestedNew };
  }, [snapshot]);

  const [plannedNew, setPlannedNew] = useState<number>(
    () => getPlanningTarget(snapshot.id) ?? throughput.suggestedNew,
  );

  const openAgreements = useMemo(
    () => hypotheses.filter((item) => item.status === "open"),
    [hypotheses],
  );

  const maxSlider = Math.max(20, Math.ceil(throughput.avgDone * 2), plannedNew + 5);
  const projectedTotal = snapshot.metrics.open + plannedNew;
  const simulatorTone =
    projectedTotal <= throughput.avgDone
      ? "safe"
      : projectedTotal <= Math.ceil(throughput.avgDone * 1.15)
        ? "tight"
        : "overload";

  function updatePlannedNew(nextValue: number) {
    const clamped = Math.max(0, Math.min(maxSlider, Math.round(nextValue)));
    setPlannedNew(clamped);
    setPlanningTarget(snapshot.id, clamped);
  }

  return (
    <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
      <header>
        <h1 className="text-3xl font-black text-foreground">{t("planning.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("planning.body")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{snapshot.label}</span>
          {isDraft ? <span className="rf-pill">{t("planning.draftBadge")}</span> : null}
        </div>
      </header>

      <p
        className={`rounded-[1.5rem] border p-5 text-sm font-medium ${
          guardrails.warnOvercommit ? "rf-step-danger" : "rf-step-mint"
        }`}
      >
        {guardrails.warnOvercommit ? t("planning.warn") : t("planning.ok")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label={t("planning.inherited")}
          value={`${guardrails.inheritedLoad}%`}
          tint={
            guardrails.inheritedLoad >= 55
              ? "danger"
              : guardrails.inheritedLoad >= 30
                ? "warn"
                : "mint"
          }
        />
        <MetricCard
          label={t("planning.open")}
          value={guardrails.openRisk}
          tint={guardrails.openRisk === 0 ? "mint" : guardrails.openRisk > 5 ? "danger" : "warn"}
        />
        <MetricCard
          label={t("planning.bottleneck")}
          value={`${guardrails.bottleneckShare}%`}
          tint={
            guardrails.bottleneckShare >= 25
              ? "danger"
              : guardrails.bottleneckShare >= 10
                ? "warn"
                : "mint"
          }
        />
        <MetricCard
          label={t("planning.avgThroughput")}
          value={throughput.avgDone}
          hint={t("planning.avgThroughputHint", { n: throughput.sprintCount })}
          tint="slate"
        />
        <MetricCard
          label={t("planning.suggestedCapacity")}
          value={throughput.suggestedNew}
          hint={t("planning.suggestedCapacityHint")}
          tint={throughput.suggestedNew === 0 ? "danger" : "mint"}
        />
      </div>

      <section
        aria-labelledby="planning-simulator-heading"
        className="rounded-[1.5rem] border border-border bg-surface-elevated p-5 space-y-4"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="planning-simulator-heading" className="text-lg font-black text-foreground">
              {t("planning.simulatorTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted">{t("planning.simulatorBody")}</p>
          </div>
          <span className="rf-pill tabular-nums">
            {t("planning.simulatorProjected", { total: projectedTotal })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="-1"
            onClick={() => updatePlannedNew(plannedNew - 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-accent-soft"
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-xs font-bold uppercase tracking-wider text-muted">
            <span className="flex items-center justify-between">
              <span>{t("planning.simulatorLabel")}</span>
              <span className="text-base font-black tabular-nums text-foreground">
                {plannedNew}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={maxSlider}
              value={plannedNew}
              onChange={(event) => updatePlannedNew(Number(event.target.value))}
              className="w-full accent-[var(--accent)]"
            />
          </label>
          <button
            type="button"
            aria-label="+1"
            onClick={() => updatePlannedNew(plannedNew + 1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground hover:bg-accent-soft"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        </div>

        <p
          className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
            simulatorTone === "safe"
              ? "rf-step-mint"
              : simulatorTone === "tight"
                ? "rf-step-warn"
                : "rf-step-danger"
          }`}
        >
          {simulatorTone === "safe"
            ? t("planning.simulatorSafe")
            : simulatorTone === "tight"
              ? t("planning.simulatorTight")
              : t("planning.simulatorOverload")}
        </p>
      </section>

      <section
        aria-labelledby="planning-agreements-heading"
        className="rounded-[1.5rem] border border-border bg-surface-elevated p-5 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="planning-agreements-heading" className="text-lg font-bold text-foreground">
            {t("planning.activeAgreementsTitle")}
          </h2>
          <Link
            href="/retro"
            className="text-xs font-bold text-accent-text hover:underline"
          >
            {t("planning.goToRetro")}
          </Link>
        </div>
        {openAgreements.length === 0 ? (
          <p className="text-sm text-muted">{t("planning.activeAgreementsEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {openAgreements.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm"
              >
                <span className="font-semibold text-foreground">{item.title}</span>
                <span className="rf-pill-warn">
                  {t(`metrics.${item.metric}`)} · {t("loop.baseline")}: {item.baseline}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="planning-carried-heading">
        <h2 id="planning-carried-heading" className="text-lg font-bold text-foreground">
          {t("planning.carriedItemsTitle")}
        </h2>
        {carriedItems.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-border p-6 text-sm text-muted">
            {t("planning.carriedItemsEmpty")}
          </p>
        ) : (
          <DailyAgenda items={carriedItems} />
        )}
      </section>

      <StepFooter
        prev={{ href: "/loop", labelKey: "nav.loop" }}
        next={{ href: "/compare", labelKey: "nav.compare" }}
        hint={t("stepFooter.planningHint")}
      />
    </main>
  );
}
