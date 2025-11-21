// Rota de compatibilidade: redireciona para /api/admin/transportadoras/[transportadoraId]/vehicles
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  const newUrl = new URL(`/api/admin/transportadoras/${params.carrierId}/vehicles`, req.url)
  const body = await req.json()
  const response = await fetch(newUrl.toString(), {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    body: JSON.stringify(body),
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

