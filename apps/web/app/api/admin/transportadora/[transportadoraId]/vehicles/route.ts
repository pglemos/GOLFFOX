// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/vehicles (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { POST as transportadoraVehiclesPOST } from '../../../transportadoras/[transportadoraId]/vehicles/route'

export async function POST(
  req: NextRequest,
  { params }: { params: { transportadoraId: string } }
) {
  return transportadoraVehiclesPOST(req, { params: { transportadoraId: params.transportadoraId } } as any)
}
