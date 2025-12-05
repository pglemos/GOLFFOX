// Rota de compatibilidade: chama a rota /api/admin/transportadoras/update
import { NextRequest } from 'next/server'
import { PUT as transportadoraUpdatePUT } from '../../transportadoras/update/route'

export async function PUT(req: NextRequest) {
  try {
    return await transportadoraUpdatePUT(req)
  } catch (error) {
    console.error('Erro na rota transportadora/update:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

