"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NeedsSnapshot } from "@/components/ceremony/needs-snapshot";
import { StepFooter } from "@/components/shell/step-footer";
import { MetricCard, toneTint } from "@/components/ui/metric-card";
import { getRetroAnswers, setRetroAnswer } from "@/lib/ceremony/answers";
import { evidenceCards, retroQuestions } from "@/lib/ceremony/signals";
import { addHypothesis } from "@/lib/loop/store";
import { useActiveSnapshot } from "@/lib/snapshots/use-snapshots";
import type { MetricKey, SprintSnapshot } from "@/lib/snapshots/types";
import { useLanguage } from "@/lib/contexts/language-context";

const HYPOTHESIS_METRICS: MetricKey[] = [
  "agingOpen",
  "bottleneckShare",
  "carryoverRate",
  "open",
  "doneRate",
];

export default function RetroPage() {
  const { t } = useLanguage();
  const { snapshot, isDraft } = useActiveSnapshot();

  if (!snapshot) {
    return (
      <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
        <h1 className="text-3xl font-black text-foreground">{t("retro.title")}</h1>
        <NeedsSnapshot />
      </main>
    );
  }

  return <RetroWithSnapshot key={snapshot.id} snapshot={snapshot} isDraft={isDraft} />;
}

function RetroWithSnapshot({
  snapshot,
  isDraft,
}: {
  snapshot: SprintSnapshot;
  isDraft: boolean;
}) {
  const { t } = useLanguage();
  const cards = useMemo(() => evidenceCards(snapshot), [snapshot]);
  const questions = useMemo(() => retroQuestions(snapshot), [snapshot]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [metric, setMetric] = useState<MetricKey>("agingOpen");
  const [direction, setDirection] = useState<"down" | "up">("down");
  const [answers, setAnswers] = useState(() => getRetroAnswers(snapshot.id));
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const selectedCard = cards.find((card) => card.metric === metric);
  const linkedTint = selectedCard ? toneTint(selectedCard.tone) : "slate";

  return (
    <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
      <header>
        <h1 className="text-3xl font-black text-foreground">{t("retro.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t("retro.body")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{snapshot.label}</span>
          {isDraft ? <span className="rf-pill">{t("retro.draftBadge")}</span> : null}
        </div>
      </header>

      <section>
        <h2 className="text-lg font-black text-foreground">{t("retro.cards")}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <MetricCard
              key={card.id}
              label={t(`metrics.${card.metric}`)}
              value={card.value}
              hint={t(`tone.${card.tone}`)}
              tint={toneTint(card.tone)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-black text-foreground">{t("retro.questions")}</h2>
        <ol className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
          {questions.map((key, index) => (
            <li
              key={key}
              className="flex min-w-0 flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:p-5"
            >
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-accent-fg"
                >
                  {index + 1}
                </span>
                <p className="pt-1 text-sm font-semibold leading-relaxed text-foreground">
                  {t(key)}
                </p>
              </div>
              <label className="grid gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                <span className="flex items-center justify-between gap-2">
                  <span>{t("retro.answer")}</span>
                  {savedKey === key ? (
                    <span className="text-[10px] font-semibold normal-case tracking-normal text-accent-text">
                      {t("retro.autoSaved")}
                    </span>
                  ) : null}
                </span>
                <textarea
                  className="min-h-28 w-full resize-y rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-foreground"
                  value={answers[key] ?? ""}
                  placeholder={t("retro.answerHint")}
                  onChange={(e) => {
                    const value = e.target.value;
                    setAnswers((current) => ({ ...current, [key]: value }));
                    setRetroAnswer(snapshot.id, key, value);
                    setSavedKey(key);
                  }}
                />
              </label>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-[1.5rem] border border-border bg-surface-elevated p-5">
        <h2 className="text-lg font-black text-foreground">{t("retro.addHypothesis")}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted sm:col-span-2">
            {t("retroForm.title")}
            <input
              className="min-h-10 rounded-xl border border-border bg-surface px-3 text-sm font-normal normal-case tracking-normal text-foreground"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted">
            {t("retroForm.metric")}
            <select
              className="min-h-10 rounded-xl border border-border bg-surface px-3 text-sm font-normal normal-case tracking-normal text-foreground"
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricKey)}
            >
              {HYPOTHESIS_METRICS.map((key) => (
                <option key={key} value={key}>
                  {t(`metrics.${key}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted">
            {t("retroForm.direction")}
            <select
              className="min-h-10 rounded-xl border border-border bg-surface px-3 text-sm font-normal normal-case tracking-normal text-foreground"
              value={direction}
              onChange={(e) => setDirection(e.target.value as "down" | "up")}
            >
              <option value="down">{t("loop.directionDown")}</option>
              <option value="up">{t("loop.directionUp")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold uppercase tracking-wider text-muted sm:col-span-2">
            {t("retro.noteLabel")}
            <input
              className="min-h-10 rounded-xl border border-border bg-surface px-3 text-sm font-normal normal-case tracking-normal text-foreground"
              value={note}
              placeholder={t("retro.notePlaceholder")}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
        </div>

        {selectedCard ? (
          <div className="mt-4 max-w-sm">
            <MetricCard
              label={t(`metrics.${selectedCard.metric}`)}
              value={selectedCard.value}
              hint={`${t(`tone.${selectedCard.tone}`)} · ${t("loop.baseline")}: ${snapshot.metrics[metric]}`}
              tint={linkedTint}
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover"
            onClick={() => {
              if (!title.trim()) {
                toast.error(t("retro.titleRequired"));
                return;
              }
              addHypothesis({
                title: title.trim(),
                metric,
                direction,
                baseline: snapshot.metrics[metric],
                note: note.trim(),
                sourceSnapshotId: snapshot.id,
              });
              setTitle("");
              setNote("");
              toast.success(t("retro.addHypothesis"));
            }}
          >
            {t("retro.addHypothesis")}
          </button>
          <Link
            href="/loop"
            className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-surface"
          >
            {t("retro.goToLoop")}
          </Link>
        </div>
      </section>

      <StepFooter
        prev={{ href: "/daily", labelKey: "nav.daily" }}
        next={{ href: "/loop", labelKey: "nav.loop" }}
        hint={t("stepFooter.retroHint")}
      />
    </main>
  );
}
