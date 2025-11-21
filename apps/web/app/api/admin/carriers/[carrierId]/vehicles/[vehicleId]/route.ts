// Rota de compatibilidade: redireciona para /api/admin/transportadoras/[transportadoraId]/vehicles/[vehicleId]
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: { carrierId: string; vehicleId: string } }
) {
  const newUrl = new URL(`/api/admin/transportadoras/${params.carrierId}/vehicles/${params.vehicleId}`, req.url)
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
  { params }: { params: { carrierId: string; vehicleId: string } }
) {
  const newUrl = new URL(`/api/admin/transportadoras/${params.carrierId}/vehicles/${params.vehicleId}`, req.url)
  const response = await fetch(newUrl.toString(), {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

