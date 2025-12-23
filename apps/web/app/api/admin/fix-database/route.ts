import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { withDangerousRouteAudit, AuditContext } from '@/lib/middleware/dangerous-route-audit'
import { withRateLimit } from '@/lib/rate-limit'
import { validateSQLOrThrow } from '@/lib/validation/sql-validator'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

async function fixDatabaseHandler(request: NextRequest, auditContext: AuditContext) {
  try {
    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    // ⚠️ ROTA PERIGOSA: Adicionar validação adicional em produção
    if (process.env.NODE_ENV === 'production') {
      const adminSecret = request.headers.get('x-admin-secret')
      const requiredSecret = process.env.ADMIN_SECRET
      
      if (requiredSecret && adminSecret !== requiredSecret) {
        return NextResponse.json(
          { error: 'Acesso negado', message: 'Secret adicional requerido para esta operação' },
          { status: 403 }
        )
      }
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Executar SQL para adicionar updated_at em companies
    const sql = `
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;
    `

    // ✅ Validar SQL antes de executar
    const validatedSQL = validateSQLOrThrow(sql)

    // Tentar executar via RPC (se disponível) ou usar query direta
    try {
      // Verificar se a coluna já existe (selecionar apenas id e updated_at para verificação)
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('id,updated_at')
        .limit(1)
        .single()

      if (company && !('updated_at' in company)) {
        // Tentar executar via função RPC (se existir)
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: validatedSQL
        })

        if (rpcError) {
          // Se RPC não funcionar, retornar instruções
          return NextResponse.json({
            success: false,
            message: 'Não foi possível executar SQL automaticamente',
            sql: validatedSQL,
            instructions: 'Execute este SQL no Supabase Dashboard (SQL Editor)'
          })
        }

        return NextResponse.json({
          success: true,
          message: 'Coluna updated_at adicionada com sucesso'
        })
      } else {
        return NextResponse.json({
          success: true,
          message: 'Coluna updated_at já existe'
        })
      }
    } catch (err) {
      // Se não conseguir executar, retornar SQL para execução manual
      return NextResponse.json({
        success: false,
        message: 'Execute este SQL manualmente no Supabase Dashboard',
        sql: validatedSQL
      })
    }
  } catch (err) {
    logError('Erro ao corrigir banco', { 
      error: err instanceof Error ? err.message : 'Erro desconhecido',
      userId: auditContext.userId 
    }, 'FixDatabaseAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao corrigir banco', message: errorMessage },
      { status: 500 }
    )
  }
}

// ✅ Exportar com auditoria obrigatória e rate limiting
const handlerWithAudit = withDangerousRouteAudit(
  fixDatabaseHandler,
  'fix_database',
  'database'
)

export const POST = withRateLimit(handlerWithAudit, 'sensitive')

