"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { usePreferences } from "@/components/preferences";
import { translations, type Language } from "@/lib/translations";

type TranslateFn = (path: string, vars?: Record<string, string | number>) => string;

type LanguageContextValue = {
  language: Language;
  t: TranslateFn;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function lookup(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function ReportLanguageBridge({ children }: { children: ReactNode }) {
  const { language } = usePreferences();
  const value = useMemo<LanguageContextValue>(() => {
    const t: TranslateFn = (path, vars) => {
      const found = lookup(translations[language], path);
      let text = typeof found === "string" ? found : path;
      if (vars) {
        for (const [key, val] of Object.entries(vars)) {
          text = text.replace(`{${key}}`, String(val));
        }
      }
      return text;
    };
    return { language, t };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within ReportLanguageBridge");
  return context;
}
