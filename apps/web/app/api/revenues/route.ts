/**
 * API: Receitas Manuais
 * GET - Lista receitas com filtros
 * POST - Cria nova receita manual
 */

import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { createRevenueSchema } from '@/lib/validation/schemas'
import type { ManualRevenue, ManualRevenueInsert, RevenueFilters } from '@/types/financial'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Supabase não configurado')
    }
    return createClient(url, serviceKey)
}

// GET /api/revenues
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

        // Parâmetros de paginação
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20'), 100)
        const offset = (page - 1) * pageSize

        // Filtros
        const filters: RevenueFilters = {
            category: searchParams.get('category') || undefined,
            contract_reference: searchParams.get('contract_reference') || undefined,
            status: (searchParams.get('status') as RevenueFilters['status']) || undefined,
            date_from: searchParams.get('date_from') || undefined,
            date_to: searchParams.get('date_to') || undefined,
            amount_min: searchParams.get('amount_min') ? parseFloat(searchParams.get('amount_min')!) : undefined,
            amount_max: searchParams.get('amount_max') ? parseFloat(searchParams.get('amount_max')!) : undefined,
            search: searchParams.get('search') || undefined,
        }

        // Ordenação
        const sortBy = searchParams.get('sort_by') || 'revenue_date'
        const sortOrder = searchParams.get('sort_order') === 'asc' ? true : false

        // Construir query
        let query = supabaseAdmin
            .from('gf_manual_revenues')
            .select(`
        *,
        company:companies(id, name),
        transportadora:transportadoras(id, name)
      `, { count: 'exact' })

        // Aplicar filtro de tenant baseado no papel
        if ((profile?.role === 'gestor_empresa' || profile?.role === 'gestor_empresa') && profile.company_id) {
            query = query.eq('company_id', profile.company_id)
        } else if ((profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_empresa') && profile.transportadora_id) {
            query = query.eq('transportadora_id', profile.transportadora_id)
        }

        // Aplicar filtros
        if (filters.category) {
            query = query.eq('category', filters.category)
        }
        if (filters.contract_reference) {
            query = query.ilike('contract_reference', `%${filters.contract_reference}%`)
        }
        if (filters.status) {
            query = query.eq('status', filters.status)
        }
        if (filters.date_from) {
            query = query.gte('revenue_date', filters.date_from)
        }
        if (filters.date_to) {
            query = query.lte('revenue_date', filters.date_to)
        }
        if (filters.amount_min !== undefined) {
            query = query.gte('amount', filters.amount_min)
        }
        if (filters.amount_max !== undefined) {
            query = query.lte('amount', filters.amount_max)
        }
        if (filters.search) {
            query = query.ilike('description', `%${filters.search}%`)
        }

        // Ordenação e paginação
        query = query
            .order(sortBy, { ascending: sortOrder })
            .range(offset, offset + pageSize - 1)

        const { data, error, count } = await query

        if (error) {
            logError('Erro ao buscar receitas', { error, filters }, 'RevenuesAPI')
            // Se a tabela não existe, retornar vazio em vez de erro
            if (error.message?.includes('does not exist') || error.code === 'PGRST205') {
                return NextResponse.json({
                    success: true,
                    data: [],
                    total: 0,
                    page,
                    pageSize,
                    totalPages: 0,
                    message: 'Execute a migration 20241211_financial_system.sql para criar as tabelas'
                })
            }
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        // Transformar para o tipo ManualRevenue (snake_case)
        import type { Database } from '@/types/supabase'
        type GfManualRevenuesRow = Database['public']['Tables']['gf_manual_revenues']['Row']
        const revenues: ManualRevenue[] = (data || []).map((row: GfManualRevenuesRow) => ({
            id: row.id,
            company_id: row.company_id,
            transportadora_id: row.transportadora_id,
            category: row.category,
            description: row.description,
            amount: parseFloat(row.amount),
            revenue_date: row.revenue_date,
            contract_reference: row.contract_reference,
            invoice_number: row.invoice_number,
            is_recurring: row.is_recurring,
            recurring_interval: row.recurring_interval,
            attachment_url: row.attachment_url,
            notes: row.notes,
            status: row.status,
            created_by: row.created_by,
            created_at: row.created_at,
            updated_at: row.updated_at,
            company: row.company,
            transportadora: row.transportadora,
        }))

        const totalPages = count ? Math.ceil(count / pageSize) : 0

        return NextResponse.json({
            success: true,
            data: revenues,
            total: count || 0,
            page,
            pageSize,
            totalPages,
        })
    } catch (error: unknown) {
      const err = error as { message?: string }
        logError('Erro interno ao processar receitas', { error }, 'RevenuesAPI')
        return NextResponse.json(
            {
                success: false,
                error: 'Erro interno do servidor',
                details: error.message || error
            },
            { status: 500 }
        )
    }
}

// POST /api/revenues
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
        const validation = createRevenueSchema.safeParse({
            category: body.category,
            description: body.description,
            amount: body.amount,
            revenue_date: body.revenueDate || body.revenue_date,
            contract_reference: body.contractReference || body.contract_reference,
            invoice_number: body.invoiceNumber || body.invoice_number,
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

        // Inserir receita
        const { data, error } = await supabaseAdmin
            .from('gf_manual_revenues')
            .insert({
                company_id: companyId,
                transportadora_id: transportadoraId,
                category: body.category,
                description: body.description,
                amount: body.amount,
                revenue_date: body.revenueDate || body.revenue_date,
                contract_reference: body.contractReference || body.contract_reference,
                invoice_number: body.invoiceNumber || body.invoice_number,
                is_recurring: body.isRecurring ?? body.is_recurring ?? false,
                recurring_interval: body.recurringInterval || body.recurring_interval,
                attachment_url: body.attachmentUrl || body.attachment_url,
                notes: body.notes,
                status: body.status ?? 'confirmed',
                created_by: userId,
            })
            .select(`
        *,
        company:companies(id, name),
        transportadora:transportadoras(id, name)
      `)
            .single()

        if (error) {
            logError('Erro ao criar receita', { error, body: { category: body.category, amount: body.amount } }, 'RevenuesAPI')
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        // Mapear retorno para ManualRevenue
        const newRevenue: ManualRevenue = {
            id: data.id,
            empresa_id: data.empresa_id,
            transportadora_id: data.transportadora_id,
            category: data.category,
            description: data.description,
            amount: parseFloat(data.amount),
            revenue_date: data.revenue_date,
            contract_reference: data.contract_reference,
            invoice_number: data.invoice_number,
            is_recurring: data.is_recurring,
            recurring_interval: data.recurring_interval,
            attachment_url: data.attachment_url,
            notes: data.notes,
            status: data.status,
            created_by: data.created_by,
            created_at: data.created_at,
            updated_at: data.updated_at,
            company: data.company,
            transportadora: data.transportadora,
        }

        return NextResponse.json({ success: true, data: newRevenue }, { status: 201 })
    } catch (error) {
        logError('Erro interno ao processar receitas', { error }, 'RevenuesAPI')
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
