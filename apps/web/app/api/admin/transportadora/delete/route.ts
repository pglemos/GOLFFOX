// Rota de compatibilidade: chama a rota /api/admin/transportadoras/delete
import { NextRequest } from 'next/server'
import { DELETE as transportadoraDeleteDELETE } from '../../transportadoras/delete/route'

export async function DELETE(req: NextRequest) {
  try {
    // A rota de delete aceita transportadoraId, então podemos chamar diretamente
    return await transportadoraDeleteDELETE(req)
  } catch (error) {
    console.error('Erro na rota transportadora/delete:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao processar requisição' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

