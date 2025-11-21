// Rota de compatibilidade: redireciona para /api/admin/transportadoras/update
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest) {
  const carrierId = req.nextUrl.searchParams.get('id')
  const newUrl = new URL('/api/admin/transportadoras/update', req.url)
  if (carrierId) {
    newUrl.searchParams.set('id', carrierId)
  }
  
  const body = await req.json()
  const response = await fetch(newUrl.toString(), {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    body: JSON.stringify(body),
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

