"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ReportDashboard } from "@/components/report/dashboard";
import { StepFooter } from "@/components/shell/step-footer";
import { computeSprintHealth } from "@/lib/ceremony/health";
import { useActiveSnapshot } from "@/lib/snapshots/use-snapshots";
import { useDraftReport } from "@/lib/report/use-draft-report";
import { useLanguage } from "@/lib/contexts/language-context";

export function ReportClient({ signedIn }: { signedIn: boolean }) {
  const { t } = useLanguage();
  const report = useDraftReport();
  const { snapshot } = useActiveSnapshot();
  const health = useMemo(() => (snapshot ? computeSprintHealth(snapshot) : null), [snapshot]);

  return (
    <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
      <header className="max-w-3xl">
        <h1 className="text-3xl font-black text-foreground">{t("report.title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("report.body")}</p>
      </header>

      {health ? (
        <section
          aria-label={t("health.score")}
          className={`rounded-[1.5rem] border p-5 ${
            health.status === "healthy"
              ? "rf-step-mint"
              : health.status === "watch"
                ? "rf-step-warn"
                : "rf-step-danger"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
                {t("health.score")}
              </p>
              <p className="mt-1 text-2xl font-black tabular-nums text-foreground">
                {health.score}/100 · {t(`health.${health.status}`)}
              </p>
            </div>
            <Link
              href="/compare"
              className="rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-bold text-foreground hover:bg-surface-elevated"
            >
              {t("brief.title")}
            </Link>
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted">
            {t("health.actionsTitle")}
          </p>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            {health.actions.map((action) => (
              <li key={action.key} className="flex items-start gap-2">
                <span aria-hidden="true" className="font-bold text-accent-text">
                  •
                </span>
                <span>{t(action.key, action.params)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {report ? (
        <>
          <ReportDashboard report={report} signedIn={signedIn} />
          <StepFooter
            prev={{ href: "/evidence", labelKey: "nav.evidence" }}
            next={{ href: "/daily", labelKey: "nav.daily" }}
            hint={t("stepFooter.reportHint")}
          />
        </>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-border p-6">
          <p className="text-sm text-muted">{t("report.empty")}</p>
          <Link
            href="/evidence"
            className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover"
          >
            {t("report.goEvidence")}
          </Link>
        </div>
      )}
    </main>
  );
}
