"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { NeedsSnapshot } from "@/components/ceremony/needs-snapshot";
import { DailyAgenda, dailyItemKey } from "@/components/ceremony/daily-agenda";
import { StepFooter } from "@/components/shell/step-footer";
import { displayBoard, displayProject } from "@/lib/analytics/display-labels";
import { getDailyDiscussed, saveDailyDiscussed } from "@/lib/ceremony/daily-state";
import { dailyRiskItems } from "@/lib/ceremony/signals";
import { useActiveSnapshot } from "@/lib/snapshots/use-snapshots";
import type { SprintSnapshot } from "@/lib/snapshots/types";
import { useLanguage } from "@/lib/contexts/language-context";

type DailyFilter = "all" | "bottleneck" | "heavy";

export default function DailyPage() {
  const { t } = useLanguage();
  const { snapshot, isDraft } = useActiveSnapshot();

  if (!snapshot) {
    return (
      <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
        <h1 className="text-3xl font-black text-foreground">{t("daily.title")}</h1>
        <NeedsSnapshot />
      </main>
    );
  }

  return <DailyWithSnapshot key={snapshot.id} snapshot={snapshot} isDraft={isDraft} />;
}

function DailyWithSnapshot({
  snapshot,
  isDraft,
}: {
  snapshot: SprintSnapshot;
  isDraft: boolean;
}) {
  const { t, language } = useLanguage();
  const lang = language === "en" ? "en" : "pt";
  const [filter, setFilter] = useState<DailyFilter>("all");
  const [assignee, setAssignee] = useState<string>("all");
  const [discussed, setDiscussed] = useState<Set<string>>(
    () => new Set(getDailyDiscussed(snapshot.id)),
  );

  const items = useMemo(() => dailyRiskItems(snapshot), [snapshot]);

  const assignees = useMemo(
    () =>
      [...new Set(items.map((item) => item.assignee))].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (filter === "bottleneck" && !item.isBottleneck) return false;
        if (filter === "heavy" && item.agingSprints < 3) return false;
        if (assignee !== "all" && item.assignee !== assignee) return false;
        return true;
      }),
    [assignee, filter, items],
  );

  const discussedInView = useMemo(
    () => filtered.filter((item) => discussed.has(dailyItemKey(item))).length,
    [discussed, filtered],
  );

  function toggleDiscussed(key: string) {
    setDiscussed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveDailyDiscussed(snapshot.id, [...next]);
      return next;
    });
  }

  async function copyAgenda() {
    if (!filtered.length) return;
    const header = `## ${t("daily.title")} (${snapshot.label})`;
    const lines = filtered.map((item, idx) => {
      const mark = discussed.has(dailyItemKey(item)) ? "x" : " ";
      const tag = item.isBottleneck ? t("cards.bottleneck") : t("cards.aging");
      return `- [${mark}] ${idx + 1}. **${item.title}** (${tag}) - ${item.assignee} · ${displayProject(item.project, lang)} · ${displayBoard(item.board, lang)} · ${item.agingSprints}x`;
    });
    try {
      await navigator.clipboard.writeText(`${header}\n\n${lines.join("\n")}\n`);
      toast.success(t("daily.agendaCopied"));
    } catch {
      toast.error(t("daily.copyFailed"));
    }
  }

  return (
    <main id="main-content" className="site-main space-y-6" tabIndex={-1}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">
            {t("daily.eyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black text-foreground">{t("daily.title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("daily.body")}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>{snapshot.label}</span>
            {isDraft ? <span className="rf-pill">{t("daily.draftBadge")}</span> : null}
            <Link
              href="/evidence"
              className="font-semibold text-accent-text hover:underline"
            >
              {t("daily.backToData")}
            </Link>
          </div>
        </div>
        {filtered.length > 0 ? (
          <button
            type="button"
            onClick={() => void copyAgenda()}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover"
          >
            <Copy size={14} aria-hidden="true" />
            {t("daily.copyAgenda")}
          </button>
        ) : null}
      </header>

      {items.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("daily.agenda")}>
            {(
              [
                ["all", t("daily.filterAll")],
                ["bottleneck", t("daily.filterBottleneck")],
                ["heavy", t("daily.filterHeavy")],
              ] as const
            ).map(([value, label]) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(value)}
                  className={
                    active
                      ? "rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-accent-fg"
                      : "rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-muted hover:text-foreground"
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted">
              <span>{t("daily.filterAssignee")}</span>
              <select
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                className="min-h-9 rounded-xl border border-border bg-surface px-2.5 text-xs font-medium text-foreground"
              >
                <option value="all">{t("daily.allAssignees")}</option>
                {assignees.map((person) => (
                  <option key={person} value={person}>
                    {person}
                  </option>
                ))}
              </select>
            </label>
            <span className="rf-pill tabular-nums">
              {t("daily.discussedCount", { done: discussedInView, total: filtered.length })}
            </span>
          </div>
        </div>
      ) : null}

      <section className="space-y-3" aria-labelledby="daily-agenda-heading">
        <h2 id="daily-agenda-heading" className="text-lg font-bold text-foreground">
          {t("daily.agenda")}
        </h2>
        {items.length > 0 && filtered.length === 0 ? (
          <p className="rounded-[14px] border border-dashed border-border p-6 text-sm text-muted">
            {t("daily.noMatches")}
          </p>
        ) : (
          <DailyAgenda
            items={filtered}
            discussedKeys={discussed}
            onToggleDiscussed={toggleDiscussed}
          />
        )}
      </section>

      <StepFooter
        prev={{ href: "/report", labelKey: "nav.report" }}
        next={{ href: "/retro", labelKey: "nav.retro" }}
        hint={t("stepFooter.dailyHint")}
      />
    </main>
  );
}
