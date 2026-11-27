"use client";

import { useMemo } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MetricCard } from "@/components/ui/metric-card";
import { StepFooter } from "@/components/shell/step-footer";
import {
  deleteHypothesis,
  dropHypothesis,
  evaluateHypotheses,
  reopenHypothesis,
} from "@/lib/loop/store";
import { useHypotheses } from "@/lib/loop/use-hypotheses";
import { useActiveSnapshot, useSnapshots } from "@/lib/snapshots/use-snapshots";
import { useLanguage } from "@/lib/contexts/language-context";

export default function LoopPage() {
  const { t } = useLanguage();
  const hypotheses = useHypotheses();
  const snapshots = useSnapshots();
  const { snapshot: latest } = useActiveSnapshot();

  const summary = useMemo(
    () => ({
      open: hypotheses.filter((item) => item.status === "open").length,
      verified: hypotheses.filter((item) => item.status === "verified").length,
      missed: hypotheses.filter((item) => item.status === "missed").length,
    }),
    [hypotheses],
  );

  return (
    <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-foreground">{t("loop.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">{t("loop.body")}</p>
        </div>
        <button
          type="button"
          className="rounded-full rf-cta-mint px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm"
          onClick={() => {
            if (!latest) {
              toast.error(t("errors.noSnapshot"));
              return;
            }
            const known = snapshots.some((item) => item.id === latest.id)
              ? snapshots
              : [latest, ...snapshots];
            const result = evaluateHypotheses(latest, known);
            if (result.evaluated === 0 && result.skippedSameSnapshot > 0) {
              toast.message(t("loop.needNewer"));
              return;
            }
            if (result.evaluated === 0) {
              toast.message(t("loop.nothingOpen"));
              return;
            }
            toast.success(t("loop.evaluateDone", { n: result.evaluated }));
          }}
        >
          {t("loop.evaluate")}
        </button>
      </header>

      {hypotheses.length > 0 ? (
        <div className="grid grid-cols-3 gap-3">
          <MetricCard
            label={t("loop.summaryOpen")}
            value={summary.open}
            tint={summary.open > 0 ? "warn" : "slate"}
          />
          <MetricCard
            label={t("loop.summaryVerified")}
            value={summary.verified}
            tint={summary.verified > 0 ? "mint" : "slate"}
          />
          <MetricCard
            label={t("loop.summaryMissed")}
            value={summary.missed}
            tint={summary.missed > 0 ? "danger" : "slate"}
          />
        </div>
      ) : null}

      {hypotheses.length === 0 ? (
        <p className="rounded-[1.5rem] border border-dashed border-border p-6 text-sm text-muted">
          {t("loop.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {hypotheses.map((item) => (
            <li key={item.id} className="rounded-2xl border border-border bg-surface-elevated p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  {item.note ? (
                    <p className="mt-1 text-xs leading-relaxed text-muted">{item.note}</p>
                  ) : null}
                  <p className="mt-1.5 text-xs text-muted">
                    {t(`metrics.${item.metric}`)} ·{" "}
                    {item.direction === "down"
                      ? t("loop.directionDown")
                      : t("loop.directionUp")}{" "}
                    · {t("loop.baseline")}: {item.baseline}
                    {item.verifiedValue != null ? ` → ${item.verifiedValue}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      item.status === "verified"
                        ? "rf-pill-mint"
                        : item.status === "missed"
                          ? "rf-pill-danger"
                          : item.status === "open"
                            ? "rf-pill-warn"
                            : "rf-pill-cyan"
                    }
                  >
                    {t(
                      `loop.${
                        item.status === "open"
                          ? "open"
                          : item.status === "verified"
                            ? "verified"
                            : item.status === "missed"
                              ? "missed"
                              : "dropped"
                      }`,
                    )}
                  </span>
                  {item.status === "open" ? (
                    <button
                      type="button"
                      className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-foreground"
                      onClick={() => dropHypothesis(item.id)}
                    >
                      {t("loop.drop")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-foreground"
                      onClick={() => {
                        reopenHypothesis(item.id);
                        toast.success(t("loop.reopened"));
                      }}
                    >
                      <RotateCcw size={11} aria-hidden="true" />
                      {t("loop.reopen")}
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={`${t("loop.remove")}: ${item.title}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-muted hover:text-danger-text"
                    onClick={() => {
                      deleteHypothesis(item.id);
                      toast.success(t("loop.removed"));
                    }}
                  >
                    <Trash2 size={11} aria-hidden="true" />
                    {t("loop.remove")}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <StepFooter
        prev={{ href: "/retro", labelKey: "nav.retro" }}
        next={{ href: "/planning", labelKey: "nav.planning" }}
        hint={t("stepFooter.loopHint")}
      />
    </main>
  );
}
