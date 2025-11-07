'use client'

import { useEffect } from 'react'
// @ts-ignore
import { Button } from '@/components/ui/button'
// @ts-ignore
import { Card } from '@/components/ui/card'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('❌ Erro na página de funcionários:', error)
    console.error('Stack trace:', error.stack)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="p-8 max-w-md w-full text-center shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-red-600">Algo deu errado!</h2>
        <p className="text-gray-600 mb-4">
          {error.message || 'Ocorreu um erro inesperado ao carregar a página de funcionários.'}
        </p>
        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="text-left text-xs text-gray-500 mb-6 bg-gray-100 p-4 rounded overflow-auto max-h-40">
            <summary className="cursor-pointer font-semibold mb-2">Detalhes técnicos</summary>
            <pre className="whitespace-pre-wrap">{error.stack}</pre>
          </details>
        )}
        <div className="flex gap-4 justify-center flex-wrap">
          <Button onClick={reset} variant="default" className="bg-orange-500 hover:bg-orange-600">
            Tentar Novamente
          </Button>
          <Button onClick={() => window.location.href = '/operator'} variant="outline">
            Ir para Dashboard
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-gray-400 mt-4">Erro ID: {error.digest}</p>
        )}
      </Card>
    </div>
  )
}

