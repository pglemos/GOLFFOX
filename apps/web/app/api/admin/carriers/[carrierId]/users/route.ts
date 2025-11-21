// Rota de compatibilidade: redireciona para /api/admin/transportadoras/[transportadoraId]/users
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  // Redirecionar internamente para a nova rota
  const newUrl = new URL(`/api/admin/transportadoras/${params.carrierId}/users`, req.url)
  const response = await fetch(newUrl.toString(), {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
