// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/vehicles
import { NextRequest } from 'next/server'
import { POST as transportadoraVehiclesPOST } from '../../../transportadoras/[transportadoraId]/vehicles/route'

export async function POST(
  req: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  return transportadoraVehiclesPOST(req, { params: { transportadoraId: params.carrierId } } as any)
}
