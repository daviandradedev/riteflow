"use client";

import { Info, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import { usePreferences } from "@/components/preferences";

const DISMISS_KEY = "rf-visitor-banner";
const DISMISS_EVENT = "rf-visitor-banner";

function subscribeDismiss(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

export function VisitorBanner() {
  const { t } = usePreferences();
  const dismissed = useSyncExternalStore(
    subscribeDismiss,
    () => sessionStorage.getItem(DISMISS_KEY) === "1",
    () => false,
  );

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  return (
    <div role="status" aria-live="polite" className="visitor-banner">
      <div className="visitor-banner-inner">
        <div className="visitor-banner-copy">
          <Info size={14} className="visitor-banner-icon" aria-hidden="true" />
          <p className="visitor-banner-text">{t("visitorBannerText")}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("closeNotice")}
          className="visitor-banner-dismiss"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
