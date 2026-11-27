"use client";

import { Compass, Home } from "lucide-react";
import Link from "next/link";
import { usePreferences } from "@/components/preferences";

export default function NotFound() {
  const { language } = usePreferences();
  const pt = language === "pt";

  return (
    <main className="site-main flex min-h-[55dvh] items-center justify-center">
      <section className="explore-modal-panel text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
          style={{ background: "var(--accent-soft)", color: "var(--accent-text)" }}
          aria-hidden="true"
        >
          <Compass size={24} />
        </div>
        <p className="font-mono text-5xl font-black leading-none tracking-tight text-accent tabular-nums">404</p>
        <h1 className="explore-modal-title">
          {pt ? "Página não encontrada" : "Page not found"}
        </h1>
        <p className="explore-modal-body">
          {pt
            ? "O endereço que você abriu não existe ou foi movido. Volte para o fluxo de evidências do Riteflow."
            : "The address you opened does not exist or has moved. Return to the Riteflow evidence flow."}
        </p>
        <div className="explore-modal-actions" style={{ justifyContent: "center" }}>
          <Link href="/evidence" className="explore-modal-primary" style={{ textDecoration: "none" }}>
            <Home size={15} aria-hidden="true" />
            <span>{pt ? "Voltar ao início" : "Back to home"}</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
