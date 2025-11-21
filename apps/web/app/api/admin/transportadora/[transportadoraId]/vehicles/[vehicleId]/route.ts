// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/vehicles/[vehicleId] (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { PUT as transportadoraVehiclePUT, DELETE as transportadoraVehicleDELETE } from '../../../../transportadoras/[transportadoraId]/vehicles/[vehicleId]/route'

export async function PUT(
  req: NextRequest,
  { params }: { params: { transportadoraId: string; vehicleId: string } }
) {
  return transportadoraVehiclePUT(req, { params: { transportadoraId: params.transportadoraId, vehicleId: params.vehicleId } } as any)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { transportadoraId: string; vehicleId: string } }
) {
  return transportadoraVehicleDELETE(req, { params: { transportadoraId: params.transportadoraId, vehicleId: params.vehicleId } } as any)
}
