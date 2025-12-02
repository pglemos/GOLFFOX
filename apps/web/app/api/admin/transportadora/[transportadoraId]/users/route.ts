// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/users (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { GET as transportadoraUsersGET } from '../../../transportadoras/[transportadoraId]/users/route'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  const params = await context.params

  return transportadoraUsersGET(req, { params: { transportadoraId: params.transportadoraId } } as any)
}
