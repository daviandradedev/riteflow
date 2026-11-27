"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHypotheses } from "@/lib/loop/use-hypotheses";
import { useDraftReport } from "@/lib/report/use-draft-report";
import { useSnapshots } from "@/lib/snapshots/use-snapshots";
import { useLanguage } from "@/lib/contexts/language-context";

const STEPS = [
  { href: "/evidence", key: "nav.evidence", doneWhen: "snapshot" as const },
  { href: "/report", key: "nav.report", doneWhen: "report" as const },
  { href: "/daily", key: "nav.daily", doneWhen: null },
  { href: "/retro", key: "nav.retro", doneWhen: null },
  { href: "/loop", key: "nav.loop", doneWhen: "hypothesis" as const },
  { href: "/planning", key: "nav.planning", doneWhen: null },
  { href: "/compare", key: "nav.compare", doneWhen: "compare" as const },
];

export function FlowTrail() {
  const pathname = usePathname();
  const { language, t } = useLanguage();
  const snapshots = useSnapshots();
  const hypotheses = useHypotheses();
  const draft = useDraftReport();
  const listRef = useRef<HTMLOListElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const flags = {
    snapshot: snapshots.length > 0 || Boolean(draft),
    report: Boolean(draft),
    hypothesis: hypotheses.length > 0,
    compare:
      snapshots.length >= 2 ||
      (draft?.milestones.length ?? 0) >= 2 ||
      hypotheses.some((item) => item.status === "verified" || item.status === "missed"),
  };

  const activeIndex = Math.max(
    0,
    STEPS.findIndex(
      (step) => pathname === step.href || pathname.startsWith(`${step.href}/`),
    ),
  );

  const syncScrollState = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    setCanPrev(el.scrollLeft > 4);
    setCanNext(maxScroll - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const activeItem = el.children[activeIndex] as HTMLElement | undefined;
    if (activeItem && typeof el.scrollTo === "function") {
      const reduced =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const targetLeft =
        activeItem.offsetLeft - el.clientWidth / 2 + activeItem.offsetWidth / 2;
      el.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: reduced ? "auto" : "smooth",
      });
    }
    syncScrollState();
    const frame = window.requestAnimationFrame(syncScrollState);
    if (typeof ResizeObserver === "undefined") {
      return () => window.cancelAnimationFrame(frame);
    }
    const observer = new ResizeObserver(syncScrollState);
    observer.observe(el);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeIndex, syncScrollState]);

  function scrollTrack(direction: -1 | 1) {
    const el = listRef.current;
    if (!el || typeof el.scrollBy !== "function") return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const step = Math.max(96, Math.round((el.clientWidth / 3) * 2));
    el.scrollBy({
      left: direction * step,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  const prevLabel = language === "pt" ? "Etapas anteriores" : "Previous steps";
  const nextLabel = language === "pt" ? "Próximas etapas" : "Next steps";

  return (
    <nav className="flow-trail" aria-label={t("quickNav")}>
      <div className="flow-trail-shell">
        <button
          type="button"
          className="flow-trail-arrow flow-trail-arrow-prev"
          aria-label={prevLabel}
          disabled={!canPrev}
          onClick={() => scrollTrack(-1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <div
          className={`flow-trail-viewport${canPrev ? " has-fade-left" : ""}${canNext ? " has-fade-right" : ""}`}
        >
          <ol ref={listRef} className="flow-trail-list" onScroll={syncScrollState}>
            {STEPS.map((step, index) => {
              const current = index === activeIndex;
              const done = step.doneWhen ? flags[step.doneWhen] : false;
              return (
                <li key={step.href} className="flow-trail-item">
                  {index > 0 ? (
                    <span
                      aria-hidden="true"
                      className={`flow-trail-line${index <= activeIndex ? " is-hot" : ""}`}
                    />
                  ) : null}
                  <Link
                    href={step.href}
                    aria-current={current ? "page" : undefined}
                    className={`flow-trail-step${current ? " is-current" : ""}${done ? " is-done" : ""}`}
                  >
                    <span className="flow-trail-dot" aria-hidden="true">
                      {done && !current ? "✓" : index + 1}
                    </span>
                    <span className="flow-trail-label">{t(step.key)}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        <button
          type="button"
          className="flow-trail-arrow flow-trail-arrow-next"
          aria-label={nextLabel}
          disabled={!canNext}
          onClick={() => scrollTrack(1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
