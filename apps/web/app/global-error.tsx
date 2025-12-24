"use client"

import { useEffect } from "react"

import { AlertTriangle, RefreshCcw, Home } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logError } from "@/lib/logger"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log do erro para monitoramento operacional
    logError("[Global Error Boundary]", { error, stack: error.stack }, 'GlobalError')
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-error-light border-4 border-error/20 mb-4">
              <AlertTriangle className="h-10 w-10 text-error" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-ink tracking-tight">Ops! Algo deu errado.</h1>
              <p className="text-ink-muted">
                Um erro inesperado ocorreu. Nossa equipe técnica já foi notificada e estamos trabalhando nisso.
              </p>
            </div>

            {error.digest && (
              <div className="p-3 bg-bg-soft rounded-lg border border-border">
                <code className="text-xs text-ink-muted break-all">ID do Erro: {error.digest}</code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => reset()}
                variant="default"
                className="w-full sm:w-auto"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
