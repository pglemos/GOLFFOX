// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/drivers (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { GET as transportadoraDriversGET, POST as transportadoraDriversPOST } from '../../../transportadoras/[transportadoraId]/drivers/route'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  const params = await context.params

  return transportadoraDriversGET(req, { params: { transportadoraId: params.transportadoraId } } as any)
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  const params = await context.params

  return transportadoraDriversPOST(req, { params: { transportadoraId: params.transportadoraId } } as any)
}
