// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/drivers
import { NextRequest } from 'next/server'
import { GET as transportadoraDriversGET, POST as transportadoraDriversPOST } from '../../../transportadoras/[transportadoraId]/drivers/route'

export async function GET(
  req: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  return transportadoraDriversGET(req, { params: { transportadoraId: params.carrierId } } as any)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { carrierId: string } }
) {
  return transportadoraDriversPOST(req, { params: { transportadoraId: params.carrierId } } as any)
}
