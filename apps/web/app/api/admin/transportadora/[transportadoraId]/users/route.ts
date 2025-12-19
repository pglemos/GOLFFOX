// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/users (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { logError } from '@/lib/logger'
import { GET as transportadoraUsersGET } from '../../../transportadoras/[transportadoraId]/users/route'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraUsersGET(req, { params: { transportadoraId: params.transportadoraId } } as any)
  } catch (error) {
    logError('Erro na rota transportadora/[transportadoraId]/users', { error }, 'TransportadoraUsersCompatAPI')
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
