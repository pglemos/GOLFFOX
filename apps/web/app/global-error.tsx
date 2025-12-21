"use client"

import * as React from "react"
import { logError } from '@/lib/logger'
import { trackError } from '@/lib/error-tracking'
import { createAlert } from '@/lib/operational-alerts'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  // ✅ Log error estruturado com contexto completo
  React.useEffect(() => {
    const context = {
      error: error.message,
      stack: error.stack,
      name: error.name,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      area: 'global'
    }

    logError('Global error capturado', context, 'GlobalError')

    // Error tracking
    trackError(error, context).catch((trackError) => {
      logError('Erro ao rastrear erro global', { error: trackError }, 'GlobalError')
    })

    // Registrar alerta operacional
    createAlert({
      type: 'other',
      severity: 'error',
      title: 'Erro crítico na aplicação',
      message: error.message || 'Erro desconhecido',
      details: context,
      source: 'global-error',
    }).catch((alertError) => {
      logError('Erro ao criar alerta operacional', { error: alertError }, 'GlobalError')
    })
  }, [error])

  return (
    <html>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              marginBottom: '16px',
              color: '#dc2626'
            }}>
              Ocorreu um erro crítico
            </h1>
            <p style={{ 
              color: '#666', 
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              {error.message || 'Um erro inesperado ocorreu. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && error.stack && (
              <details style={{ 
                marginBottom: '24px',
                padding: '12px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Detalhes técnicos (modo desenvolvimento)
                </summary>
                <pre style={{ 
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {error.stack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={reset}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Tentar novamente
              </button>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/'
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#2563eb',
                  border: '1px solid #2563eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Ir para Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
