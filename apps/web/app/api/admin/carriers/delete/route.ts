// Rota de compatibilidade: redireciona para /api/admin/transportadoras/delete
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(req: NextRequest) {
  const carrierId = req.nextUrl.searchParams.get('id')
  const newUrl = new URL('/api/admin/transportadoras/delete', req.url)
  if (carrierId) {
    newUrl.searchParams.set('id', carrierId)
  }
  
  const response = await fetch(newUrl.toString(), {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

