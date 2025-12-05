// Rota de compatibilidade: chama a rota /api/admin/transportadoras/[transportadoraId]/drivers/[driverId] (mantém plural para compatibilidade com rotas principais)
import { NextRequest } from 'next/server'
import { PUT as transportadoraDriverPUT, DELETE as transportadoraDriverDELETE } from '../../../../transportadoras/[transportadoraId]/drivers/[driverId]/route'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; driverId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraDriverPUT(req, { params: { transportadoraId: params.transportadoraId, driverId: params.driverId } } as any)
  } catch (error) {
    console.error('Erro na rota transportadora/[transportadoraId]/drivers/[driverId] PUT:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId: string; driverId: string }> }
) {
  try {
    const params = await context.params
    return await transportadoraDriverDELETE(req, { params: { transportadoraId: params.transportadoraId, driverId: params.driverId } } as any)
  } catch (error) {
    console.error('Erro na rota transportadora/[transportadoraId]/drivers/[driverId] DELETE:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
