"use client";

import type { ReportPayload } from "@/lib/analytics/engine";
import { useLanguage } from "@/lib/contexts/language-context";
import { COLOR_DONE, COLOR_OPEN } from "@/lib/colors";

export function ContributorMix({ report }: { report: ReportPayload }) {
  const { t } = useLanguage();
  const rows = report.contributorMix;
  if (!rows.length) return null;

  const maxInvolved = Math.max(...rows.map((r) => r.involved), 1);

  return (
    <section className="rounded-[16px] border border-[#d8e0e8] bg-white p-5 dark:border-border dark:bg-surface-elevated">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#1f2937] dark:text-foreground">
            {t("tables.contributorMix")}
          </h3>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#667085] dark:text-muted">
            {t("tables.contributorMixHint")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-[#667085] dark:text-muted">
          <LegendDot color={COLOR_DONE} label={t("labels.done")} />
          <LegendDot color={COLOR_OPEN} label={t("labels.open")} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row) => {
          const donePct = (row.completed / maxInvolved) * 100;
          const openPct = (row.open / maxInvolved) * 100;
          return (
            <div
              key={row.person}
              data-pdf-row
              className="grid grid-cols-1 items-center gap-3 rounded-[12px] border border-[#d8e0e8] bg-[#fbfcfe] px-3 py-3 sm:grid-cols-[minmax(120px,180px)_1fr_auto] sm:px-4 dark:border-border dark:bg-surface"
            >
              <div className="min-w-0">
                <p
                  className="truncate text-sm font-bold text-[#213247] dark:text-foreground"
                  title={row.person}
                >
                  {row.person}
                </p>
                <p className="text-[11px] text-[#667085] dark:text-muted">
                  {t("labels.involved")}: {row.involved} · {t("labels.qa")}: {row.qa}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex h-2.5 overflow-hidden rounded-full bg-[#e8eef4] dark:bg-border-subtle">
                  <span
                    className="h-full rounded-l-full"
                    style={{ width: `${donePct}%`, background: COLOR_DONE }}
                    title={`${t("labels.done")}: ${row.completed}`}
                  />
                  <span
                    className="h-full"
                    style={{ width: `${openPct}%`, background: COLOR_OPEN }}
                    title={`${t("labels.open")}: ${row.open}`}
                  />
                </div>
                <p className="text-[11px] tabular-nums text-[#667085] dark:text-muted">
                  {t("labels.done")} {row.completed} · {t("labels.open")} {row.open}
                </p>
              </div>

              <div className="text-right text-[11px] tabular-nums text-[#667085] dark:text-muted sm:min-w-[7rem]">
                <span className="font-semibold text-[#1f2937] dark:text-foreground">
                  {row.shareOfCompleted}%
                </span>{" "}
                {t("labels.ofCompleted")}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
