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

export async function GET(request: NextRequest) {
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
    
    // Tentar diferentes views em ordem de prioridade
    const views = [
      'v_admin_kpis_materialized',
      'v_admin_kpis',
      'v_operator_kpis'
    ]

    let kpisData: any[] = []
    let lastError: any = null

    for (const viewName of views) {
      try {
        const { data, error } = await supabaseAdmin
          .from(viewName as any)
          .select('*')
        
        if (error) {
          const code = (error as any)?.code
          if (code === 'PGRST205') {
            // View não existe, tentar próxima
            continue
          }
          lastError = error
          continue
        }

        if (data && data.length > 0) {
          kpisData = data
          break
        }
      } catch (err) {
        lastError = err
        continue
      }
    }

    if (kpisData.length === 0 && lastError) {
      console.warn('Nenhuma view de KPIs disponível, retornando array vazio')
    }

    return NextResponse.json({
      success: true,
      kpis: kpisData
    })
  } catch (error: any) {
    console.error('Erro ao buscar KPIs:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar KPIs', message: error.message },
      { status: 500 }
    )
  }
}

