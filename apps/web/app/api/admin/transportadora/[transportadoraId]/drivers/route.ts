// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/motoristas (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { logError } from '@/lib/logger'
import { GET as transportadoraDriversGET, POST as transportadoraDriversPOST } from '../../../transportadoras/[transportadoraId]/drivers/route'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraDriversGET(req, { params: { transportadoraId: params.transportadoraId } } as any)
  } catch (error) {
    logError('Erro na rota transportadora/[transportadoraId]/motoristas GET', { error }, 'TransportadoraDriversCompatAPI')
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraDriversPOST(req, { params: { transportadoraId: params.transportadoraId } } as any)
  } catch (error) {
    logError('Erro na rota transportadora/[transportadoraId]/motoristas POST', { error }, 'TransportadoraDriversCompatAPI')
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
