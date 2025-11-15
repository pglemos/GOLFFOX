import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    if (authErrorResponse && isDevelopment) {
      console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Executar SQL para adicionar updated_at em companies
    const sql = `
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
      UPDATE companies SET updated_at = created_at WHERE updated_at IS NULL;
    `

    // Tentar executar via RPC (se disponível) ou usar query direta
    try {
      // Verificar se a coluna já existe
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('*')
        .limit(1)
        .single()

      if (company && !('updated_at' in company)) {
        // Tentar executar via função RPC (se existir)
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('exec_sql', {
          sql_query: sql
        })

        if (rpcError) {
          // Se RPC não funcionar, retornar instruções
          return NextResponse.json({
            success: false,
            message: 'Não foi possível executar SQL automaticamente',
            sql: sql,
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
    } catch (error: any) {
      // Se não conseguir executar, retornar SQL para execução manual
      return NextResponse.json({
        success: false,
        message: 'Execute este SQL manualmente no Supabase Dashboard',
        sql: sql
      })
    }
  } catch (error: any) {
    console.error('Erro ao corrigir banco:', error)
    return NextResponse.json(
      { error: 'Erro ao corrigir banco', message: error.message },
      { status: 500 }
    )
  }
}

