"use client"

import { Component, ReactNode } from "react"

import { AlertTriangle, Home, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { logError } from "@/lib/logger"
import { createAlert } from "@/lib/operational-alerts"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class TransportadoraErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const context = {
      error: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString(),
      area: 'transportadora'
    }

    logError('TransportadoraErrorBoundary capturou um erro', context, 'TransportadoraErrorBoundary')

    // Registrar alerta operacional
    createAlert({
      type: 'other',
      severity: 'error',
      title: 'Erro na área de transportadora',
      message: error.message || 'Erro desconhecido',
      details: context,
      source: 'transportadora-error-boundary',
    }).catch((alertError) => {
      logError('Erro ao criar alerta operacional', { error: alertError }, 'TransportadoraErrorBoundary')
    })

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Recarregar a página para garantir estado limpo
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg-soft">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertTriangle className="h-12 w-12 text-error mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-error">Erro na área de transportadora</h2>
            <p className="text-ink-muted mb-4">
              Ocorreu um erro inesperado ao carregar a página da transportadora.
              Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
            </p>
            {this.state.error && (
              <details className="text-left text-sm text-ink-muted mb-4 bg-bg-soft p-4 rounded">
                <summary className="cursor-pointer font-medium mb-2">Detalhes do erro:</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2">
                  {this.state.error.message}
                </pre>
                {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                  <pre className="whitespace-pre-wrap text-xs mt-2 overflow-auto max-h-48">
                    {this.state.error.stack}
                  </pre>
                )}
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={this.handleReset} 
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => window.location.href = '/transportadora'} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

