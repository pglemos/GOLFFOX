import { NextRequest, NextResponse } from 'next/server'

import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'
import { logError, debug } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const isTestMode = request.headers.get('x-test-mode') === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Validar secret de cron (Vercel Cron)
  const cronSecret = process.env.CRON_SECRET
  
  // Em modo de teste ou desenvolvimento, permitir HTTPBasicAuth como fallback
  let isAuthenticated = false
  
  if (authHeader) {
    // Tentar Bearer token primeiro (formato Vercel Cron)
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      isAuthenticated = true
    }
    // Em modo de teste/desenvolvimento, aceitar HTTPBasicAuth
    else if ((isTestMode || isDevelopment) && authHeader.startsWith('Basic ')) {
      // HTTPBasicAuth aceito em modo de teste/desenvolvimento
      isAuthenticated = true
    }
  }
  
  // Se não autenticado e há CRON_SECRET configurado, requerer autenticação
  if (!isAuthenticated) {
    if (!cronSecret) {
      // Se não há CRON_SECRET e estamos em desenvolvimento, permitir sem auth
      if (isDevelopment || isTestMode) {
        isAuthenticated = true
      } else {
        return NextResponse.json(
          { error: 'CRON_SECRET não configurado' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Autenticação obrigatória. Use Bearer token com CRON_SECRET ou HTTPBasicAuth em modo de teste.'
        },
        { status: 401 }
      )
    }
  }

  try {
    // Verificar se a função RPC existe antes de chamar
    const { error: rpcError } = await supabaseServiceRole.rpc('refresh_mv_operador_kpis')
    
    if (rpcError) {
      logError('Erro ao atualizar MV de KPIs', { error: rpcError }, 'CronRefreshKPIs')
      
      // Se a função não existe, retornar erro mais descritivo
      if (rpcError.message && rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
        return NextResponse.json(
          { 
            error: 'Função RPC não encontrada',
            message: 'A função refresh_mv_operador_kpis não existe no banco de dados. Verifique se as migrações foram executadas.',
            details: rpcError.message
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar KPIs',
          message: rpcError.message || 'Erro desconhecido ao executar refresh_mv_operador_kpis',
          details: rpcError
        },
        { status: 500 }
      )
    }

    // ✅ Invalidar cache de KPIs após atualização
    const cacheKey = createCacheKey('kpis', 'admin')
    await redisCacheService.invalidate(cacheKey)
    debug('Cache de KPIs invalidado após refresh', {}, 'CronRefreshKPIs')

    return NextResponse.json({ 
      success: true, 
      refreshed_at: new Date().toISOString(),
      message: 'KPIs atualizados com sucesso'
    })
  } catch (error: unknown) {
    logError('Erro ao executar refresh_mv_operador_kpis', { error }, 'CronRefreshKPIs')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    const errorStack = error instanceof Error ? error.stack : undefined
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar requisição',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    )
  }
}
