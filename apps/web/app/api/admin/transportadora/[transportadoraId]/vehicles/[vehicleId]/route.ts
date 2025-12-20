// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/veiculos/[vehicleId] (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { logError } from '@/lib/logger'
import { PUT as transportadoraVehiclePUT, DELETE as transportadoraVehicleDELETE } from '../../../../transportadoras/[transportadoraId]/vehicles/[vehicleId]/route'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; vehicleId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraVehiclePUT(req, { params: { transportadoraId: params.transportadoraId, vehicleId: params.vehicleId } } as any)
  } catch (error) {
    logError('Erro na rota transportadora/[transportadoraId]/veiculos/[vehicleId] PUT', { error }, 'TransportadoraVehiclesCompatAPI')
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; vehicleId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraVehicleDELETE(req, { params: { transportadoraId: params.transportadoraId, vehicleId: params.vehicleId } } as any)
  } catch (error) {
    logError('Erro na rota transportadora/[transportadoraId]/veiculos/[vehicleId] DELETE', { error }, 'TransportadoraVehiclesCompatAPI')
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
