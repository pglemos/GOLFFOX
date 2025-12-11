/**
 * DEPRECATED: Esta rota foi movida para /api/operador/optimize-route
 * Mantida apenas para compatibilidade - redireciona para a nova rota
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  // Redirecionar para a rota atualizada
  const newUrl = new URL('/api/operador/optimize-route', request.url)
  
  // Copiar body e headers
  const body = await request.text()
  const headers = new Headers(request.headers)
  
  // Fazer requisição interna para a nova rota
  const response = await fetch(newUrl.toString(), {
    method: 'POST',
    headers,
    body
  })
  
  const responseData = await response.text()
  
  return new NextResponse(responseData, {
    status: response.status,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'X-Deprecated-Route': 'true',
      'X-New-Route': '/api/operador/optimize-route'
    }
  })
}
