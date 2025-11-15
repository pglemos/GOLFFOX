"use client"

import { Component, ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class FuncionariosErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('❌ Erro capturado pelo ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="p-8 max-w-md w-full text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro inesperado</h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro ao carregar a página de funcionários.
            </p>
            {this.state.error && (
              <details className="text-left text-sm text-gray-500 mb-4 bg-gray-50 p-4 rounded">
                <summary className="cursor-pointer font-medium mb-2">Detalhes do erro:</summary>
                <pre className="whitespace-pre-wrap text-xs mt-2">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-2 justify-center">
              <Button 
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }} 
                variant="default"
              >
                Tentar Novamente
              </Button>
              <Button 
                onClick={() => window.location.href = '/operator'} 
                variant="outline"
              >
                Voltar
              </Button>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

