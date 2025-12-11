/**
 * API: Orçamentos
 * GET - Lista orçamentos por período
 * POST - Cria/atualiza orçamento
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
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

        let profile: { role: string; company_id?: string; carrier_id?: string } | null = null

        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token)
            if (user) {
                const { data: p } = await supabaseAdmin
                    .from('profiles')
                    .select('role, company_id, carrier_id')
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
        if (profile?.role === 'empresa' && profile.company_id) {
            query = query.eq('company_id', profile.company_id)
        } else if ((profile?.role === 'transportadora' || profile?.role === 'operador') && profile.carrier_id) {
            query = query.eq('carrier_id', profile.carrier_id)
        }

        const { data, error } = await query

        if (error) {
            console.error('[API] Erro ao buscar orçamentos:', error)
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

        // Transformar para camelCase
        const budgets: Budget[] = (data || []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            companyId: row.company_id as string | null,
            carrierId: row.carrier_id as string | null,
            categoryId: row.category_id as string | null,
            categoryName: row.category_name as string | null,
            periodYear: row.period_year as number,
            periodMonth: row.period_month as number,
            budgetedAmount: parseFloat(row.budgeted_amount as string),
            alertThresholdPercent: row.alert_threshold_percent as number,
            notes: row.notes as string | null,
            createdBy: row.created_by as string | null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            category: row.category as Budget['category'],
        }))

        return NextResponse.json({ success: true, data: budgets })
    } catch (error) {
        console.error('[API] Erro interno:', error)
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
        let profile: { role: string; company_id?: string; carrier_id?: string } | null = null

        if (token) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(token)
            if (user) {
                userId = user.id
                const { data: p } = await supabaseAdmin
                    .from('profiles')
                    .select('role, company_id, carrier_id')
                    .eq('id', user.id)
                    .single()
                profile = p
            }
        }

        const body: BudgetInsert = await request.json()

        // Validação básica
        if (!body.periodYear || !body.periodMonth || body.budgetedAmount === undefined) {
            return NextResponse.json(
                { success: false, error: 'Ano, mês e valor orçado são obrigatórios' },
                { status: 400 }
            )
        }

        if (body.periodMonth < 1 || body.periodMonth > 12) {
            return NextResponse.json(
                { success: false, error: 'Mês deve estar entre 1 e 12' },
                { status: 400 }
            )
        }

        if (body.budgetedAmount < 0) {
            return NextResponse.json(
                { success: false, error: 'Valor orçado não pode ser negativo' },
                { status: 400 }
            )
        }

        // Definir tenant baseado no papel
        let companyId = body.companyId
        let carrierId = body.carrierId

        if (profile?.role === 'empresa') {
            companyId = profile.company_id
            carrierId = null
        } else if (profile?.role === 'transportadora' || profile?.role === 'operador') {
            carrierId = profile.carrier_id
            companyId = null
        }

        // Upsert - cria ou atualiza
        const { data, error } = await supabaseAdmin
            .from('gf_budgets')
            .upsert({
                company_id: companyId,
                carrier_id: carrierId,
                category_id: body.categoryId,
                category_name: body.categoryName,
                period_year: body.periodYear,
                period_month: body.periodMonth,
                budgeted_amount: body.budgetedAmount,
                alert_threshold_percent: body.alertThresholdPercent ?? 80,
                notes: body.notes,
                created_by: userId,
            }, {
                onConflict: 'company_id,carrier_id,category_id,period_year,period_month'
            })
            .select(`
        *,
        category:gf_cost_categories(id, name, icon, color)
      `)
            .single()

        if (error) {
            console.error('[API] Erro ao salvar orçamento:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data }, { status: 201 })
    } catch (error) {
        console.error('[API] Erro interno:', error)
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
