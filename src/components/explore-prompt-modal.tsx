"use client";

import { LogIn, X } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import { usePreferences } from "@/components/preferences";
import { redirectToAuthLogin } from "@/lib/login-redirect";

const DISMISS_KEY = "rf-explore-notice";
const DISMISS_EVENT = "rf-explore-notice";

function subscribeExploreNotice(onChange: () => void) {
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => window.removeEventListener(DISMISS_EVENT, onChange);
}

export function ExplorePromptModal() {
  const { t } = usePreferences();
  const dismissed = useSyncExternalStore(
    subscribeExploreNotice,
    () => sessionStorage.getItem(DISMISS_KEY) === "1",
    () => true,
  );

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    window.dispatchEvent(new Event(DISMISS_EVENT));
  }

  useEffect(() => {
    if (dismissed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      className="explore-modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rf-explore-title"
        aria-describedby="rf-explore-body"
        className="explore-modal-panel"
      >
        <div className="explore-modal-head">
          <p className="explore-modal-eyebrow">{t("exploreEyebrow")}</p>
          <button
            type="button"
            className="explore-modal-close"
            onClick={dismiss}
            aria-label={t("closeNotice")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <h2 id="rf-explore-title" className="explore-modal-title">
          {t("exploreTitle")}
        </h2>
        <p id="rf-explore-body" className="explore-modal-body">
          {t("exploreBody")}
        </p>
        <div className="explore-modal-actions">
          <button type="button" onClick={redirectToAuthLogin} className="explore-modal-primary">
            <LogIn size={15} aria-hidden="true" />
            <span>{t("signInToSave")}</span>
          </button>
          <button type="button" onClick={dismiss} className="explore-modal-secondary">
            {t("exploreContinue")}
          </button>
        </div>
      </div>
    </div>
  );
}
