"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Compass,
  ExternalLink,
  Globe,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { usePreferences } from "@/components/preferences";
import { useLanguage } from "@/lib/contexts/language-context";
import { CONTACT_URL, PORTFOLIO_URL } from "@/lib/site-links";

type CommandItem = {
  id: string;
  group: "navigation" | "actions";
  label: string;
  keywords: string;
  icon: "nav" | "theme" | "lang" | "external";
  onSelect: () => void;
};

type CommandMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const router = useRouter();
  const { language, theme, toggleLanguage, toggleTheme, t: tShell } = usePreferences();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = useMemo<CommandItem[]>(
    () => [
      {
        id: "nav-evidence",
        group: "navigation",
        label: t("nav.evidence"),
        keywords: "dados evidence upload csv import manual backup",
        icon: "nav",
        onSelect: () => router.push("/evidence"),
      },
      {
        id: "nav-report",
        group: "navigation",
        label: t("nav.report"),
        keywords: "relatorio report pdf html csv json charts",
        icon: "nav",
        onSelect: () => router.push("/report"),
      },
      {
        id: "nav-daily",
        group: "navigation",
        label: t("nav.daily"),
        keywords: "daily pauta agenda standup gargalo bottleneck",
        icon: "nav",
        onSelect: () => router.push("/daily"),
      },
      {
        id: "nav-retro",
        group: "navigation",
        label: t("nav.retro"),
        keywords: "retro retrospectiva perguntas combinados",
        icon: "nav",
        onSelect: () => router.push("/retro"),
      },
      {
        id: "nav-loop",
        group: "navigation",
        label: t("nav.loop"),
        keywords: "combinados loop follow-ups hipoteses",
        icon: "nav",
        onSelect: () => router.push("/loop"),
      },
      {
        id: "nav-planning",
        group: "navigation",
        label: t("nav.planning"),
        keywords: "planning capacidade heranca carryover simulador",
        icon: "nav",
        onSelect: () => router.push("/planning"),
      },
      {
        id: "nav-compare",
        group: "navigation",
        label: t("nav.compare"),
        keywords: "fechamento wrap-up dossie brief comparar compare sprints tendencia evolucao",
        icon: "nav",
        onSelect: () => router.push("/compare"),
      },
      {
        id: "act-theme",
        group: "actions",
        label: tShell("actionToggleTheme"),
        keywords: "tema theme dark light escuro claro",
        icon: "theme",
        onSelect: () => toggleTheme(),
      },
      {
        id: "act-lang",
        group: "actions",
        label: tShell("actionToggleLanguage"),
        keywords: "idioma language portugues english pt en",
        icon: "lang",
        onSelect: () => toggleLanguage(),
      },
      {
        id: "act-contact",
        group: "actions",
        label: tShell("actionContact"),
        keywords: "contato contact email davi",
        icon: "external",
        onSelect: () => window.open(`${CONTACT_URL}?lang=${language}`, "_blank", "noopener,noreferrer"),
      },
      {
        id: "act-portfolio",
        group: "actions",
        label: tShell("actionPortfolio"),
        keywords: "portfolio daviandrade home",
        icon: "external",
        onSelect: () => window.open(PORTFOLIO_URL, "_blank", "noopener,noreferrer"),
      },
    ],
    [language, router, t, tShell, toggleLanguage, toggleTheme],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) || item.keywords.toLowerCase().includes(q),
    );
  }, [items, query]);

  const boundedIndex = filtered.length ? Math.min(activeIndex, filtered.length - 1) : 0;

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  const navItems = filtered.filter((item) => item.group === "navigation");
  const actionItems = filtered.filter((item) => item.group === "actions");

  function runItem(item: CommandItem) {
    onClose();
    setQuery("");
    item.onSelect();
  }

  function renderIcon(icon: CommandItem["icon"]) {
    if (icon === "theme") {
      return theme === "dark" ? (
        <Sun size={15} aria-hidden="true" />
      ) : (
        <Moon size={15} aria-hidden="true" />
      );
    }
    if (icon === "lang") return <Globe size={15} aria-hidden="true" />;
    if (icon === "external") return <ExternalLink size={15} aria-hidden="true" />;
    return <Compass size={15} aria-hidden="true" />;
  }

  function renderGroup(title: string, groupItems: CommandItem[]) {
    if (!groupItems.length) return null;
    return (
      <div className="command-group">
        <p className="command-group-title">{title}</p>
        <ul className="command-list" role="listbox">
          {groupItems.map((item) => {
            const flatIndex = filtered.indexOf(item);
            const selected = flatIndex === boundedIndex;
            return (
              <li key={item.id} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`command-item${selected ? " is-selected" : ""}`}
                  onMouseEnter={() => setActiveIndex(flatIndex)}
                  onClick={() => runItem(item)}
                >
                  <span className="command-item-left">
                    <span className="command-item-icon">{renderIcon(item.icon)}</span>
                    <span>{item.label}</span>
                  </span>
                  <ArrowRight size={14} className="command-item-arrow" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div
      className="command-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={tShell("quickJump")}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setQuery("");
          onClose();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setQuery("");
          onClose();
        } else if (event.key === "ArrowDown" && filtered.length) {
          event.preventDefault();
          setActiveIndex((current) => (current + 1) % filtered.length);
        } else if (event.key === "ArrowUp" && filtered.length) {
          event.preventDefault();
          setActiveIndex((current) => (current - 1 + filtered.length) % filtered.length);
        } else if (event.key === "Enter" && filtered[boundedIndex]) {
          event.preventDefault();
          runItem(filtered[boundedIndex]!);
        }
      }}
    >
      <div className="command-panel">
        <div className="command-input-wrap">
          <Search size={16} className="command-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder={tShell("commandPlaceholder")}
            aria-label={tShell("quickJump")}
            className="command-input"
          />
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onClose();
            }}
            aria-label={tShell("closeMenu")}
            className="command-close-btn"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="command-body custom-scrollbar">
          {filtered.length === 0 ? (
            <p className="command-empty">{tShell("commandEmpty")}</p>
          ) : (
            <>
              {renderGroup(tShell("groupNavigation"), navItems)}
              {renderGroup(tShell("groupActions"), actionItems)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
