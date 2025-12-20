// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/veiculos (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { logError } from '@/lib/logger'
import { GET as transportadoraVehiclesGET, POST as transportadoraVehiclesPOST } from '../../../transportadoras/[transportadoraId]/vehicles/route'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraVehiclesGET(req, { params: { transportadoraId: params.transportadoraId } } as any)
  } catch (error) {
    logError('Erro na rota transportadora/[transportadoraId]/veiculos GET', { error }, 'TransportadoraVehiclesCompatAPI')
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
    return await transportadoraVehiclesPOST(req, { params: { transportadoraId: params.transportadoraId } } as any)
  } catch (error) {
    logError('Erro na rota transportadora/[transportadoraId]/veiculos POST', { error }, 'TransportadoraVehiclesCompatAPI')
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
