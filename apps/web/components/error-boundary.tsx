/**
 * Error Boundary para capturar erros do React
 */

'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createAlert } from '@/lib/operational-alerts'
import { logError } from '@/lib/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // ✅ Log estruturado do erro
    logError('ErrorBoundary capturou um erro', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }, 'ErrorBoundary')

    // Registrar alerta operacional (com tratamento de erro - não bloquear renderização)
    createAlert({
      type: 'other',
      severity: 'error',
      title: 'Erro de React capturado',
      message: error.message || 'Erro desconhecido',
      details: {
        componentStack: errorInfo.componentStack,
        stack: error.stack,
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      },
      source: 'error-boundary',
    }).catch((alertError) => {
      // Não bloquear se createAlert falhar, mas logar o erro
      logError('Erro ao criar alerta operacional', { error: alertError }, 'ErrorBoundary')
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-soft">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-error">
                <AlertTriangle className="h-5 w-5" />
                Oops! Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-ink-muted">
                Ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-mono text-sm text-error mb-2">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.error.stack && (
                    <pre className="text-xs overflow-auto max-h-64">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
                <Button
                  onClick={() => {
                    window.location.href = '/'
                  }}
                  variant="default"
                >
                  Ir para Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

