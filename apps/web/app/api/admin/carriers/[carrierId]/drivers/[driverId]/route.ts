// Rota de compatibilidade: redireciona para /api/admin/transportadoras/[transportadoraId]/drivers/[driverId]
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: { carrierId: string; driverId: string } }
) {
  const newUrl = new URL(`/api/admin/transportadoras/${params.carrierId}/drivers/${params.driverId}`, req.url)
  const body = await req.json()
  const response = await fetch(newUrl.toString(), {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    body: JSON.stringify(body),
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { carrierId: string; driverId: string } }
) {
  const newUrl = new URL(`/api/admin/transportadoras/${params.carrierId}/drivers/${params.driverId}`, req.url)
  const response = await fetch(newUrl.toString(), {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

