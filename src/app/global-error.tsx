"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#f8f9fc",
          color: "#111827",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <main
          style={{
            width: "min(100%, 30rem)",
            padding: "2rem",
            borderRadius: "16px",
            border: "1px solid #d8e0e8",
            background: "#ffffff",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: 900, lineHeight: 1, letterSpacing: "-0.04em", color: "#1d4ed8", fontVariantNumeric: "tabular-nums" }}>
            500
          </p>
          <h1 style={{ margin: "0.75rem 0 0", fontSize: "1.5rem", fontWeight: 800 }}>
            Algo deu errado
          </h1>
          <p style={{ margin: "0.75rem 0 0", fontSize: "0.92rem", lineHeight: 1.55, color: "#64748b" }}>
            Ocorreu um erro inesperado no Riteflow. Tente novamente ou volte para o início.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.65rem", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: "2.75rem",
                padding: "0 1.25rem",
                borderRadius: "999px",
                border: "1px solid #1d4ed8",
                background: "#1d4ed8",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={() => window.location.assign("/")}
              style={{
                minHeight: "2.75rem",
                padding: "0 1.25rem",
                borderRadius: "999px",
                border: "1px solid #d8e0e8",
                background: "#ffffff",
                color: "#111827",
                fontWeight: 650,
                cursor: "pointer",
              }}
            >
              Voltar ao início
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
