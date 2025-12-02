// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/drivers/[driverId] (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { PUT as transportadoraDriverPUT, DELETE as transportadoraDriverDELETE } from '../../../../transportadoras/[transportadoraId]/drivers/[driverId]/route'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; driverId: string }> }
) {
  const params = await context.params

  return transportadoraDriverPUT(req, { params: { transportadoraId: params.transportadoraId, driverId: params.driverId } } as any)
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; driverId: string }> }
) {
  const params = await context.params

  return transportadoraDriverDELETE(req, { params: { transportadoraId: params.transportadoraId, driverId: params.driverId } } as any)
}
