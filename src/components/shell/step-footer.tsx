"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/contexts/language-context";

type StepLink = {
  href: string;
  labelKey: string;
};

export function StepFooter({
  prev,
  next,
  hint,
}: {
  prev?: StepLink;
  next?: StepLink;
  hint?: string;
}) {
  const { t } = useLanguage();

  return (
    <nav
      aria-label={t("stepFooter.aria")}
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated p-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        {prev ? (
          <Link
            href={prev.href}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-2 text-xs font-bold text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            {t(prev.labelKey)}
          </Link>
        ) : null}
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>

      {next ? (
        <Link
          href={next.href}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg transition-colors hover:bg-accent-hover"
        >
          <span>
            {t("stepFooter.nextPrefix")}: {t(next.labelKey)}
          </span>
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </nav>
  );
}
