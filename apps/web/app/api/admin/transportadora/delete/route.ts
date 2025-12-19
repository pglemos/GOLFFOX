// Rota de compatibilidade: chama a rota /api/admin/transportadoras/delete
import { NextRequest, NextResponse } from 'next/server'
import { DELETE as transportadoraDeleteDELETE } from '../../transportadoras/delete/route'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export async function DELETE(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    // A rota de delete aceita transportadoraId, então podemos chamar diretamente
    return await transportadoraDeleteDELETE(req)
  } catch (error) {
    logError('Erro na rota transportadora/delete', { error }, 'TransportadoraDeleteAPI')
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

