"use client";

import { usePreferences } from "@/components/preferences";

export function SkipLink() {
  const { t } = usePreferences();

  return (
    <a href="#main-content" className="skip-link">
      {t("skipToContent")}
    </a>
  );
}
