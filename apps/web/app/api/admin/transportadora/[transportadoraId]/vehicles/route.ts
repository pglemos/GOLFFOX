// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/vehicles (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { GET as transportadoraVehiclesGET, POST as transportadoraVehiclesPOST } from '../../../transportadoras/[transportadoraId]/vehicles/route'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  const params = await context.params

  return transportadoraVehiclesGET(req, { params: Promise.resolve({ transportadoraId: params.transportadoraId, carrierId: params.transportadoraId }) } as any)
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  const params = await context.params

  return transportadoraVehiclesPOST(req, { params: Promise.resolve({ transportadoraId: params.transportadoraId, carrierId: params.transportadoraId }) } as any)
}
