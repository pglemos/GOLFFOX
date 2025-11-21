// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/drivers/[driverId]
import { NextRequest } from 'next/server'
import { PUT as transportadoraDriverPUT, DELETE as transportadoraDriverDELETE } from '../../../../transportadoras/[transportadoraId]/drivers/[driverId]/route'

export async function PUT(
  req: NextRequest,
  { params }: { params: { transportadoraId: string; driverId: string } }
) {
  return transportadoraDriverPUT(req, { params: { transportadoraId: params.transportadoraId, driverId: params.driverId } } as any)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { transportadoraId: string; driverId: string } }
) {
  return transportadoraDriverDELETE(req, { params: { transportadoraId: params.transportadoraId, driverId: params.driverId } } as any)
}
