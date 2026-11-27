"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/contexts/language-context";

export function NeedsSnapshot() {
  const { t } = useLanguage();
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-surface p-6">
      <p className="text-sm text-muted">{t("errors.noSnapshot")}</p>
      <Link href="/evidence" className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-fg hover:bg-accent-hover">
        {t("home.ctaEvidence")}
      </Link>
    </div>
  );
}
