"use client"

import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
      <div className="max-w-md w-full p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] text-center">
        <h1 className="text-xl font-semibold text-[var(--ink-strong)]">Algo deu errado</h1>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">{error.message || "Erro inesperado"}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button variant="outline" asChild>
            <a href="/">Ir para início</a>
          </Button>
        </div>
      </div>
    </div>
  )
}

