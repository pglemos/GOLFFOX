import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth, validateAuth, requireCompanyAccess } from '@/lib/api-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { logger, logError } from '@/lib/logger'

async function getCostsKpisHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period') || '30' // 30 ou 90 dias

    // ✅ Validar autenticação primeiro
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authError = await requireAuth(request, ['admin', 'operador'])
    if (authError) {
      if (isDevelopment) {
        logger.warn('⚠️ Auth falhou em desenvolvimento, continuando KPIs')
      } else {
        return authError
      }
    }

    // Se não há company_id, verificar se é admin (pode listar todos)
    if (!companyId) {
      const user = await validateAuth(request)
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { 
            error: 'company_id é obrigatório',
            message: 'O parâmetro company_id é obrigatório para operadores. Admins podem omitir para listar KPIs de todas as empresas.'
          },
          { status: 400 }
        )
      }
      // Admin pode listar sem filtro de company (mas precisamos de pelo menos um company_id para a view)
      // Por enquanto, retornar erro mais descritivo
      return NextResponse.json(
        { 
          error: 'company_id é obrigatório',
          message: 'O parâmetro company_id é obrigatório. A view v_costs_kpis requer um company_id específico.'
        },
        { status: 400 }
      )
    }

    // ✅ Validar acesso à empresa se company_id fornecido
    let userCtx: { role: string; id?: string; companyId?: string } | null = null
    if (isDevelopment) {
      userCtx = { role: 'admin' }
    } else {
      const { user, error: companyError } = await requireCompanyAccess(request, companyId)
      if (companyError) {
        return companyError
      }
      userCtx = user as { role: string; id?: string; companyId?: string }
    }

    // Buscar KPIs da view (view materializada - selecionar todas as colunas)
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('v_costs_kpis')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle()

    if (error) {
      logError('Erro ao buscar KPIs de custos', { error, companyId }, 'CostsKpisAPI')
      
      // Verificar se erro é porque view não existe
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('view')) {
        if (isDevelopment) {
          return NextResponse.json({
            company_id: companyId,
            totalCosts: 0,
            budget: 0,
            variance: 0,
            period_days: parseInt(period)
          }, { status: 200 })
        }
        return NextResponse.json(
          { 
            error: 'View v_costs_kpis não encontrada',
            message: 'A view v_costs_kpis não existe no banco de dados. Execute as migrações de views de custos para criar a view.',
            hint: 'Verifique se a migração v44_costs_views.sql foi executada'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message || 'Erro ao buscar KPIs de custos',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      )
    }
    
    // Se não há dados, retornar valores padrão
    if (!data) {
      return NextResponse.json({
        company_id: companyId,
        totalCosts: 0,
        budget: 0,
        variance: 0,
        period_days: parseInt(period)
      })
    }

    // Adicionar variação vs orçamento se houver
    const periodDays = period === '90' ? 90 : 30
    const { data: budgetData, error: budgetError } = await supabase
      .from('v_costs_vs_budget')
      .select('budgeted_amount, actual_amount, variance_percent')
      .eq('company_id', companyId)
      .gte('period_year', new Date().getFullYear())
      .limit(1)
      .maybeSingle()
    
    // Se view não existe, não é erro crítico, apenas não teremos dados de budget
    if (budgetError && !budgetError.message?.includes('does not exist') && !budgetError.message?.includes('relation')) {
      logger.warn('Erro ao buscar dados de budget:', budgetError)
    }

    const response = {
      ...(data as any),
      budget_variance: budgetData ? {
        budgeted: (budgetData as any).budgeted_amount || 0,
        actual: (budgetData as any).actual_amount || 0,
        variance_percent: (budgetData as any).variance_percent || 0,
        variance_absolute: ((budgetData as any).actual_amount || 0) - ((budgetData as any).budgeted_amount || 0)
      } : null,
      period_days: parseInt(period)
    }

    return NextResponse.json(response)
  } catch (err) {
    logError('Erro ao buscar KPIs de custos', { error: err, companyId }, 'CostsKpisAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(getCostsKpisHandler, 'api')

