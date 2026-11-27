"use client";

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { usePreferences } from "@/components/preferences";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { language } = usePreferences();
  const pt = language === "pt";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="site-main flex min-h-[55dvh] items-center justify-center">
      <section className="explore-modal-panel text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
          aria-hidden="true"
        >
          <AlertTriangle size={24} />
        </div>
        <p className="font-mono text-5xl font-black leading-none tracking-tight text-accent tabular-nums">500</p>
        <h1 className="explore-modal-title">
          {pt ? "Algo deu errado" : "Something went wrong"}
        </h1>
        <p className="explore-modal-body">
          {pt
            ? "Ocorreu um erro inesperado ao carregar este módulo. Tente novamente ou volte ao início."
            : "An unexpected error occurred while loading this module. Try again or return home."}
        </p>
        <div className="explore-modal-actions" style={{ justifyContent: "center" }}>
          <button type="button" onClick={reset} className="explore-modal-primary">
            <RefreshCw size={15} aria-hidden="true" />
            <span>{pt ? "Tentar novamente" : "Try again"}</span>
          </button>
          <Link href="/evidence" className="explore-modal-secondary" style={{ textDecoration: "none" }}>
            <Home size={15} aria-hidden="true" />
            <span>{pt ? "Voltar ao início" : "Back to home"}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
