"use client"

import * as React from "react"
import { logError } from '@/lib/logger'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  // ✅ Log error estruturado
  React.useEffect(() => {
    logError('Global error capturado', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }, 'GlobalError')
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h1>Ocorreu um erro</h1>
          <p>{error.message}</p>
          <button onClick={reset} style={{ marginTop: 12 }}>Tentar novamente</button>
        </div>
      </body>
    </html>
  )
}
