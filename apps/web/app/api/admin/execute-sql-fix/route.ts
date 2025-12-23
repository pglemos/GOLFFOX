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

async function executeSqlFixHandler(request: NextRequest, auditContext: AuditContext) {
  try {
    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    // ⚠️ ROTA PERIGOSA: Adicionar validação adicional em produção
    if (process.env.NODE_ENV === 'production') {
      // Em produção, pode requerer secret adicional ou desabilitar completamente
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

    // Criar função SQL que pode ser executada via RPC
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION fix_companies_updated_at()
      RETURNS void AS $$
      BEGIN
        -- Adicionar coluna se não existir
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'companies' 
          AND column_name = 'updated_at'
        ) THEN
          ALTER TABLE public.companies ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
          UPDATE public.companies SET updated_at = created_at WHERE updated_at IS NULL;
        END IF;

        -- Corrigir função do trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = TG_TABLE_SCHEMA 
            AND table_name = TG_TABLE_NAME 
            AND column_name = 'updated_at'
          ) THEN
            NEW.updated_at = NOW();
          END IF;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Recriar trigger
        DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
        CREATE TRIGGER update_companies_updated_at 
          BEFORE UPDATE ON public.companies
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column();
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // ✅ Validar SQL antes de executar
    const validatedSQL = validateSQLOrThrow(createFunctionSQL)

    // Tentar executar via RPC (se a função já existir)
    try {
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('fix_companies_updated_at')
      
      if (!rpcError) {
        return NextResponse.json({
          success: true,
          message: 'Correção aplicada com sucesso via RPC'
        })
      }
    } catch (err) {
      // Função não existe ainda, continuar
    }

    // Se RPC não funcionar, retornar instruções
    return NextResponse.json({
      success: false,
      message: 'Execute o SQL manualmente no Supabase Dashboard',
      sql: validatedSQL,
      instructions: [
        '1. Acesse Supabase Dashboard > SQL Editor',
        '2. Execute o SQL fornecido acima',
        '3. Depois execute: SELECT fix_companies_updated_at();'
      ]
    })
  } catch (error: any) {
    logError('Erro ao executar correção', { 
      error: error.message,
      userId: auditContext.userId 
    }, 'ExecuteSQLFixAPI')
    return NextResponse.json(
      { error: 'Erro ao executar correção', message: error.message },
      { status: 500 }
    )
  }
}

// ✅ Exportar com auditoria obrigatória e rate limiting
const handlerWithAudit = withDangerousRouteAudit(
  executeSqlFixHandler,
  'execute_sql_fix',
  'database'
)

export const POST = withRateLimit(handlerWithAudit, 'sensitive')

