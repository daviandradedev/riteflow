import type { ReactNode } from "react";

export type MetricTint =
  | "mint"
  | "indigo"
  | "violet"
  | "cyan"
  | "slate"
  | "danger"
  | "warn";

const TINT_CLASS: Record<MetricTint, string> = {
  mint: "rf-tint-mint",
  indigo: "rf-tint-indigo",
  violet: "rf-tint-violet",
  cyan: "rf-tint-cyan",
  slate: "rf-tint-slate",
  danger: "rf-tint-danger",
  warn: "rf-tint-warn",
};

export function MetricCard({
  label,
  value,
  hint,
  tint = "indigo",
  children,
}: {
  label: string;
  value?: string | number;
  hint?: string;
  tint?: MetricTint;
  children?: ReactNode;
}) {
  return (
    <article className={`rf-metric-card ${TINT_CLASS[tint]}`}>
      <p className="rf-metric-label">{label}</p>
      {value != null ? <p className="rf-metric-value">{value}</p> : null}
      {hint ? <p className="rf-metric-hint">{hint}</p> : null}
      {children}
    </article>
  );
}

export function toneTint(tone: "ok" | "watch" | "risk"): MetricTint {
  if (tone === "ok") return "mint";
  if (tone === "risk") return "danger";
  return "warn";
}
