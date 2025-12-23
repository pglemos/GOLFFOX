"use client"

import { Component, ReactNode } from "react"

import { AlertCircle, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { logError } from "@/lib/logger"

interface Props {
  children: ReactNode
  onClose?: () => void
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary específico para modais
 * Previne que erros em modais quebrem toda a aplicação
 */
export class ModalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logError('ModalErrorBoundary capturou um erro', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString(),
      area: 'modal'
    }, 'ModalErrorBoundary')
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    // Fechar o modal se houver handler
    if (this.props.onClose) {
      this.props.onClose()
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-5 w-5 text-error" />
            <h3 className="text-lg font-semibold text-error">Erro no modal</h3>
            {this.props.onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={this.props.onClose}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-ink-muted mb-4">
            Ocorreu um erro ao carregar este modal. Por favor, tente novamente.
          </p>
          {this.state.error && process.env.NODE_ENV === 'development' && (
            <details className="mb-4">
              <summary className="cursor-pointer text-sm text-ink-muted mb-2">
                Detalhes do erro (dev mode)
              </summary>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {this.state.error.message}
                {this.state.error.stack && `\n${this.state.error.stack}`}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline" size="sm">
              Tentar Novamente
            </Button>
            {this.props.onClose && (
              <Button onClick={this.props.onClose} variant="default" size="sm">
                Fechar
              </Button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

