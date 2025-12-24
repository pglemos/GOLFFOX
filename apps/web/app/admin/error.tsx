"use client"

import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-bg">
      <div className="max-w-md w-full p-3 rounded-xl border border-white/10 bg-bg-soft text-center">
        <h1 className="text-xl font-semibold text-text-ink-strong">Algo deu errado</h1>
        <p className="mt-2 text-sm text-ink-muted">{error.message || "Erro inesperado"}</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button onClick={reset}>Tentar novamente</Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/"}
          >
            Ir para início
          </Button>
        </div>
      </div>
    </div>
  )
}
