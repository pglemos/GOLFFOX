// Rota de compatibilidade: redireciona para /api/admin/create-transportadora-login
import { NextRequest, NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const newUrl = new URL('/api/admin/create-transportadora-login', req.url)
    const body = await req.json()
    
    // Rota de compatibilidade - redireciona para create-transportadora-login
    
    const response = await fetch(newUrl.toString(), {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    logError('Erro na rota create-transportadora-login', { error }, 'CreateCarrierLoginAPI')
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

