"use client"

import * as React from "react"

export default function SentryExamplePage() {
  const [lastError, setLastError] = React.useState<string | null>(null)

  const triggerError = async () => {
    try {
      throw new Error("Sentry test error from /sentry-example-page")
    } catch (e: any) {
      setLastError(e?.message || String(e))
      try {
        const Sentry = await import("@sentry/nextjs")
        Sentry.captureException(e)
      } catch (_) {
        // ignore if Sentry is not configured or fails to load
      }
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b1324", color: "#fff" }}>
      <div style={{ maxWidth: 640, padding: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>GolfFox — Sentry Example Page</h1>
        <p style={{ opacity: 0.8, marginBottom: 16 }}>
          Esta página lança um erro de teste e o reporta via Sentry quando configurado.
        </p>
        <button
          onClick={triggerError}
          style={{
            background: "#5b8cff",
            border: "none",
            borderRadius: 8,
            padding: "12px 16px",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Lançar erro de teste
        </button>
        {lastError && (
          <div style={{ marginTop: 16, background: "#152043", padding: 12, borderRadius: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Último erro lançado:</div>
            <code style={{ fontFamily: "monospace" }}>{lastError}</code>
          </div>
        )}
        <div style={{ marginTop: 24, opacity: 0.7 }}>
          Dica: defina a variável de ambiente <code>SENTRY_DSN</code> no build para habilitar a captura.
        </div>
      </div>
    </div>
  )
}
