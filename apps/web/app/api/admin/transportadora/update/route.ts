// Rota de compatibilidade: chama a rota /api/admin/transportadoras/update
import { NextRequest, NextResponse } from 'next/server'
import { PUT as transportadoraUpdatePUT } from '../../transportadoras/update/route'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export async function PUT(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    return await transportadoraUpdatePUT(req)
  } catch (error) {
    logError('Erro na rota transportadora/update', { error }, 'TransportadoraUpdateAPI')
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
}

