"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileSpreadsheet,
  GitCompareArrows,
  Globe,
  LogIn,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { AuthUserChip, type HeaderUser } from "@/components/auth-user-chip";
import { BrandWordmark } from "@/components/brand-wordmark";
import { LoginButton } from "@/components/login-button";
import { LanguageToggle, ThemeToggle, usePreferences } from "@/components/preferences";
import { CommandMenu } from "@/components/shell/command-menu";
import { FlowTrail } from "@/components/shell/flow-trail";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/lib/contexts/language-context";
import { redirectToAuthLogin } from "@/lib/login-redirect";
import { useCommandShortcutLabel } from "@/lib/shortcut";
import { CONTACT_URL, PORTFOLIO_URL } from "@/lib/site-links";

const NAV_LINKS = [
  { href: "/evidence", key: "nav.evidence", icon: FileSpreadsheet },
  { href: "/report", key: "nav.report", icon: BarChart3 },
  { href: "/daily", key: "nav.daily", icon: CalendarClock },
  { href: "/retro", key: "nav.retro", icon: MessageSquare },
  { href: "/loop", key: "nav.loop", icon: CheckCircle2 },
  { href: "/planning", key: "nav.planning", icon: Sparkles },
  { href: "/compare", key: "nav.compare", icon: GitCompareArrows },
] as const;

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
  const { language, t } = usePreferences();
  const { t: tApp } = useLanguage();
  const shortcut = useCommandShortcutLabel();
  const [commandOpen, setCommandOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setMenuOpen(false);
        setCommandOpen((prev) => !prev);
      } else if (event.key === "Escape" && menuOpen) {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const userLabel = user?.name?.trim() || user?.email || "";
  const appMark = t("appMark");
  const appMarkInitial = appMark.slice(0, 1);
  const appMarkRest = appMark.slice(1);

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner site-header-inner-app">
          <div className="site-header-row">
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`daviandrade.dev. ${t("opensInNewTab")}`}
              className="brand-lockup header-wordmark"
            >
              <BrandWordmark />
            </a>

            <Link href="/evidence" className="project-brand">
              <span className="project-brand-initial">{appMarkInitial}</span>
              {appMarkRest}
            </Link>

            <div className="header-desktop-controls" role="group" aria-label={t("preferences")}>
              <button
                type="button"
                className="header-cmd-trigger"
                aria-keyshortcuts="Meta+K Control+K"
                title={`${t("quickJump")} (${shortcut})`}
                onClick={() => setCommandOpen(true)}
              >
                <Search size={14} aria-hidden="true" />
                <span className="sr-only">{t("quickJump")} </span>
                <kbd className="header-cmd-kbd">{shortcut}</kbd>
              </button>
              <a
                href={`${CONTACT_URL}?lang=${language}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${t("contact")}. ${t("opensInNewTab")}`}
                className="header-nav-link"
              >
                {t("contact")}
              </a>
              <LanguageToggle />
              <ThemeToggle />
              {user ? <AuthUserChip user={user} /> : <LoginButton />}
            </div>

            <div className="header-mobile-controls">
              <button
                type="button"
                className="header-icon-btn"
                aria-label={t("quickJump")}
                onClick={() => {
                  setMenuOpen(false);
                  setCommandOpen(true);
                }}
              >
                <Search size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="header-icon-btn"
                aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((prev) => !prev)}
              >
                {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
        <FlowTrail />
      </header>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />

      {menuOpen ? (
        <div
          className="liquid-glass-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t("navigation")}
          onClick={(event) => {
            if (event.target === event.currentTarget) setMenuOpen(false);
          }}
        >
          <button
            type="button"
            className="liquid-glass-close"
            aria-label={t("closeMenu")}
            onClick={() => setMenuOpen(false)}
          >
            <X size={20} aria-hidden="true" />
          </button>

          <div className="liquid-glass-stack is-grid">
            <div
              className="liquid-glass-toggles-row"
              style={{ "--lg-i": 0 } as CSSProperties}
            >
              <LanguageToggle />
              <ThemeToggle />
            </div>

            <nav className="liquid-glass-nav is-grid" aria-label={t("navigation")}>
              {NAV_LINKS.map((item, idx) => {
                const current =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={current ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`liquid-glass-pill${current ? " is-accent" : ""}`}
                    style={{ "--lg-i": idx + 1 } as CSSProperties}
                  >
                    <span className="liquid-glass-icon" aria-hidden="true">
                      <Icon size={15} />
                    </span>
                    <span className="liquid-glass-label">{tApp(item.key)}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="liquid-glass-pair liquid-glass-section-gap">
              <a
                href={`${CONTACT_URL}?lang=${language}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="liquid-glass-pill"
                style={{ "--lg-i": NAV_LINKS.length + 1 } as CSSProperties}
              >
                <span className="liquid-glass-icon" aria-hidden="true">
                  <Mail size={15} />
                </span>
                <span className="liquid-glass-label">{t("contact")}</span>
              </a>

              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="liquid-glass-pill"
                style={{ "--lg-i": NAV_LINKS.length + 2 } as CSSProperties}
              >
                <span className="liquid-glass-icon" aria-hidden="true">
                  <Globe size={15} />
                </span>
                <span className="liquid-glass-label">daviandrade.dev</span>
              </a>
            </div>

            {user ? (
              <div className="liquid-glass-pair liquid-glass-section-gap">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    window.location.assign("/api/auth/handoff");
                  }}
                  className="liquid-glass-pill"
                  style={{ "--lg-i": NAV_LINKS.length + 3 } as CSSProperties}
                >
                  <span className="liquid-glass-icon" aria-hidden="true">
                    <User size={15} />
                  </span>
                  <span className="liquid-glass-label">{userLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setMenuOpen(false);
                    await authClient.signOut();
                    window.location.reload();
                  }}
                  className="liquid-glass-pill"
                  style={{ "--lg-i": NAV_LINKS.length + 4 } as CSSProperties}
                >
                  <span className="liquid-glass-icon" aria-hidden="true">
                    <LogOut size={15} />
                  </span>
                  <span className="liquid-glass-label">{t("signOut")}</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  redirectToAuthLogin();
                }}
                className="liquid-glass-pill is-accent liquid-glass-section-gap"
                style={{ "--lg-i": NAV_LINKS.length + 3 } as CSSProperties}
              >
                <span className="liquid-glass-icon" aria-hidden="true">
                  <LogIn size={15} />
                </span>
                <span className="liquid-glass-label">{t("login")}</span>
              </button>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
