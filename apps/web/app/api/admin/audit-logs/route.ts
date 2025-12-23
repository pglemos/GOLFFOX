import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const auditColumns = 'id,actor_id,action_type,resource_type,resource_id,details,created_at'
    const { data, error } = await supabaseAdmin
      .from('gf_audit_log')
      .select(auditColumns)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logError('Erro ao buscar audit log', { error, limit }, 'AuditLogAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar audit log', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      logs: data || []
    })
  } catch (err) {
    logError('Erro ao listar audit log', { error: err }, 'AuditLogAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar audit log', message: errorMessage },
      { status: 500 }
    )
  }
}
