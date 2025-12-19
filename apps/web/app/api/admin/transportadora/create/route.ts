// Rota de compatibilidade: chama a rota /api/admin/transportadoras/create
import { NextRequest, NextResponse } from 'next/server'
import { POST as transportadoraCreatePOST } from '../../transportadoras/create/route'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export async function POST(req: NextRequest) {
  // Verificar autenticação admin (a rota chamada também verifica, mas melhor garantir aqui também)
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    return await transportadoraCreatePOST(req)
  } catch (error) {
    logError('Erro na rota transportadora/create', { error }, 'TransportadoraCreateAPI')
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

