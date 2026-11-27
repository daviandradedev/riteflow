"use client";

import { Check } from "lucide-react";
import type { AnalyzedItem } from "@/lib/analytics/engine";
import { displayBoard, displayProject } from "@/lib/analytics/display-labels";
import { useLanguage } from "@/lib/contexts/language-context";

type DailyAgendaProps = {
  items: AnalyzedItem[];
  compact?: boolean;
  discussedKeys?: Set<string>;
  onToggleDiscussed?: (key: string) => void;
};

export function dailyItemKey(item: AnalyzedItem): string {
  return `${item.milestone}::${item.title}`;
}

export function DailyAgenda({
  items,
  compact = false,
  discussedKeys,
  onToggleDiscussed,
}: DailyAgendaProps) {
  const { t, language } = useLanguage();
  const lang = language === "en" ? "en" : "pt";
  const shown = compact ? items.slice(0, 5) : items;

  if (shown.length === 0) {
    return (
      <p className="rounded-[14px] border border-dashed border-[#d8e0e8] p-6 text-sm text-[#667085] dark:border-border dark:text-muted">
        {t("daily.empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {shown.map((item, index) => {
        const key = dailyItemKey(item);
        const heavy = item.isBottleneck || item.agingSprints >= 3;
        const discussed = Boolean(discussedKeys?.has(key));
        return (
          <li
            key={key}
            className={`rounded-[14px] border p-4 transition-opacity ${
              heavy ? "rf-step-danger" : "rf-step-warn"
            } ${discussed ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2.5">
                {onToggleDiscussed && !compact ? (
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={discussed}
                    aria-label={`${discussed ? t("daily.discussed") : t("daily.markDiscussed")}: ${item.title}`}
                    onClick={() => onToggleDiscussed(key)}
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors ${
                      discussed
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-border bg-surface-elevated text-transparent hover:border-accent"
                    }`}
                  >
                    <Check size={13} strokeWidth={3} aria-hidden="true" />
                  </button>
                ) : null}
                <p
                  className={`font-semibold text-[#213247] dark:text-foreground ${
                    discussed ? "line-through" : ""
                  }`}
                >
                  <span className="mr-2 text-[#667085] dark:text-muted">{index + 1}.</span>
                  {item.link.startsWith("http") ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="rf-task-link"
                    >
                      {item.title}
                    </a>
                  ) : (
                    item.title
                  )}
                </p>
              </div>
              <span className="rf-pill shrink-0">
                {item.isBottleneck ? t("cards.bottleneck") : t("cards.aging")}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#667085] dark:text-muted">
              {item.assignee} · {displayProject(item.project, lang)} · {t("daily.board")}:{" "}
              {displayBoard(item.board, lang)} · {t("daily.age")}: {item.agingSprints}x
            </p>
          </li>
        );
      })}
    </ul>
  );
}
