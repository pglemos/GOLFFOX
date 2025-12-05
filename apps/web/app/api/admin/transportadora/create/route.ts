// Rota de compatibilidade: chama a rota /api/admin/transportadoras/create
import { NextRequest } from 'next/server'
import { POST as transportadoraCreatePOST } from '../../transportadoras/create/route'

export async function POST(req: NextRequest) {
  try {
    return await transportadoraCreatePOST(req)
  } catch (error) {
    console.error('Erro na rota transportadora/create:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

