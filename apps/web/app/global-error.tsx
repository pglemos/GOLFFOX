"use client"

import * as React from "react"

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  // Log error to console for debugging
  console.error('Global error:', error)

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
