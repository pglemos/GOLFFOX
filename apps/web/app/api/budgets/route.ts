/**
 * API: Orçamentos
 * GET - Lista orçamentos por período
 * POST - Cria/atualiza orçamento
 */

import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { budgetSchema } from '@/lib/validation/schemas'
import type { Budget, BudgetInsert } from '@/types/financial'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Supabase não configurado')
    }
    return createClient(url, serviceKey)
}

// GET /api/budgets
export async function GET(request: NextRequest) {
    try {
        // Requerer autenticação
        const authResponse = await requireAuth(request)
        if (authResponse) return authResponse

        const supabaseAdmin = getSupabaseAdmin()
        const token = request.headers.get('authorization')?.replace('Bearer ', '')

        let profile: { role: string; company_id?: string; transportadora_id?: string } | null = null

        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token)
            if (user) {
                const { data: p } = await supabaseAdmin
                    .from('profiles')
                    .select('role, company_id, transportadora_id')
                    .eq('id', user.id)
                    .single()
                profile = p
            }
        }

        const { searchParams } = new URL(request.url)

        // Parâmetros
        const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined
        const categoryId = searchParams.get('category_id')

        // Construir query
        let query = supabaseAdmin
            .from('gf_budgets')
            .select(`
        *,
        category:gf_cost_categories(id, name, icon, color)
      `)
            .eq('period_year', year)
            .order('period_month', { ascending: true })

        // Filtrar por mês se especificado
        if (month) {
            query = query.eq('period_month', month)
        }

        // Filtrar por categoria
        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        // Aplicar filtro de tenant
        if ((profile?.role === 'gestor_empresa' || profile?.role === 'gestor_empresa') && profile.company_id) {
            query = query.eq('company_id', profile.company_id)
        } else if ((profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_empresa') && profile.transportadora_id) {
            query = query.eq('transportadora_id', profile.transportadora_id)
        }

        const { data, error } = await query

        if (error) {
            logError('Erro ao buscar orçamentos', { error, year, month, categoryId }, 'BudgetsAPI')
            // Se a tabela não existe, retornar vazio em vez de erro
            if (error.message?.includes('does not exist') || error.code === 'PGRST205') {
                return NextResponse.json({
                    success: true,
                    data: [],
                    message: 'Execute a migration 20241211_financial_system.sql para criar as tabelas'
                })
            }
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        // Transformar para o tipo Budget (snake_case)
        const budgets: Budget[] = (data || []).map((row: any) => ({
            id: row.id,
            company_id: row.company_id,
            transportadora_id: row.transportadora_id,
            category_id: row.category_id,
            category_name: row.category_name,
            period_year: row.period_year,
            period_month: row.period_month,
            budgeted_amount: parseFloat(row.budgeted_amount),
            alert_threshold_percent: row.alert_threshold_percent,
            notes: row.notes,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            category: row.category,
        }))

        return NextResponse.json({ success: true, data: budgets })
    } catch (error: unknown) {
        logError('Erro interno', { error }, 'BudgetsAPI')
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// POST /api/budgets - Upsert (cria ou atualiza)
export async function POST(request: NextRequest) {
    try {
        // Requerer autenticação
        const authResponse = await requireAuth(request)
        if (authResponse) return authResponse

        const supabaseAdmin = getSupabaseAdmin()
        const token = request.headers.get('authorization')?.replace('Bearer ', '')

        let userId: string | null = null
        let profile: { role: string; company_id?: string; transportadora_id?: string } | null = null

        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token)
            if (user) {
                userId = user.id
                const { data: p } = await supabaseAdmin
                    .from('profiles')
                    .select('role, company_id, transportadora_id')
                    .eq('id', user.id)
                    .single()
                profile = p
            }
        }

        const body = await request.json()

        // Validar com Zod
        const validation = budgetSchema.safeParse({
            period_year: body.periodYear || body.period_year,
            period_month: body.periodMonth || body.period_month,
            budgeted_amount: body.budgetedAmount || body.budgeted_amount,
            company_id: body.companyId || body.company_id,
            transportadora_id: body.transportadoraId || body.transportadora_id,
            category_id: body.categoryId || body.category_id,
            alert_threshold_percent: body.alertThresholdPercent || body.alert_threshold_percent,
            notes: body.notes,
            ...body
        })

        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Dados inválidos',
                    details: validation.error.errors
                },
                { status: 400 }
            )
        }

        const validated = validation.data

        // Definir tenant baseado no papel
        let companyId = body.companyId
        let transportadoraId = body.carrierId || body.transportadoraId || body.transportadora_id

        if (profile?.role === 'gestor_empresa' || profile?.role === 'gestor_empresa') {
            companyId = profile.company_id
            transportadoraId = null
        } else if (profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_empresa') {
            transportadoraId = profile.transportadora_id
            companyId = null
        }

        // Upsert - cria ou atualiza
        const { data, error } = await supabaseAdmin
            .from('gf_budgets')
            .upsert({
                company_id: companyId,
                transportadora_id: transportadoraId,
                category_id: validated.category_id,
                category_name: body.categoryName || body.category_name,
                period_year: validated.period_year,
                period_month: validated.period_month,
                budgeted_amount: validated.budgeted_amount,
                alert_threshold_percent: validated.alert_threshold_percent ?? 80,
                notes: validated.notes,
                created_by: userId,
            }, {
                onConflict: 'company_id,transportadora_id,category_id,period_year,period_month'
            })
            .select(`
        *,
        category:gf_cost_categories(id, name, icon, color)
      `)
            .single()

        if (error) {
            logError('Erro ao salvar orçamento', { error, body: { categoryId: body.categoryId, periodYear: body.periodYear, periodMonth: body.periodMonth } }, 'BudgetsAPI')
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        // Mapear retorno para ManualCost
        const newBudget: Budget = {
            id: data.id,
            company_id: data.company_id,
            transportadora_id: data.transportadora_id,
            category_id: data.category_id,
            category_name: data.category_name,
            period_year: data.period_year,
            period_month: data.period_month,
            budgeted_amount: parseFloat(data.budgeted_amount),
            alert_threshold_percent: data.alert_threshold_percent,
            notes: data.notes,
            created_by: data.created_by,
            created_at: data.created_at,
            updated_at: data.updated_at,
            category: data.category,
        }

        return NextResponse.json({ success: true, data: newBudget }, { status: 201 })
    } catch (error) {
        logError('Erro interno', { error }, 'BudgetsAPI')
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
