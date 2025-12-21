/**
 * API: Receitas Manuais
 * GET - Lista receitas com filtros
 * POST - Cria nova receita manual
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import type { ManualRevenue, ManualRevenueInsert, RevenueFilters } from '@/types/financial'
import { createRevenueSchema } from '@/lib/validation/schemas'

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
            contractReference: searchParams.get('contract_reference') || undefined,
            status: (searchParams.get('status') as RevenueFilters['status']) || undefined,
            dateFrom: searchParams.get('date_from') || undefined,
            dateTo: searchParams.get('date_to') || undefined,
            amountMin: searchParams.get('amount_min') ? parseFloat(searchParams.get('amount_min')!) : undefined,
            amountMax: searchParams.get('amount_max') ? parseFloat(searchParams.get('amount_max')!) : undefined,
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
        transportadora:carriers(id, name)
      `, { count: 'exact' })

        // Aplicar filtro de tenant baseado no papel
        if (profile?.role === 'empresa' && profile.company_id) {
            query = query.eq('company_id', profile.company_id)
        } else if ((profile?.role === 'transportadora' || profile?.role === 'operador') && profile.transportadora_id) {
            query = query.eq('transportadora_id', profile.transportadora_id)
        }

        // Aplicar filtros
        if (filters.category) {
            query = query.eq('category', filters.category)
        }
        if (filters.contractReference) {
            query = query.ilike('contract_reference', `%${filters.contractReference}%`)
        }
        if (filters.status) {
            query = query.eq('status', filters.status)
        }
        if (filters.dateFrom) {
            query = query.gte('revenue_date', filters.dateFrom)
        }
        if (filters.dateTo) {
            query = query.lte('revenue_date', filters.dateTo)
        }
        if (filters.amountMin !== undefined) {
            query = query.gte('amount', filters.amountMin)
        }
        if (filters.amountMax !== undefined) {
            query = query.lte('amount', filters.amountMax)
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

        // Transformar para camelCase
        const revenues: ManualRevenue[] = (data || []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            companyId: row.company_id as string | null,
            carrierId: row.transportadora_id as string | null,
            category: row.category as string,
            description: row.description as string,
            amount: parseFloat(row.amount as string),
            revenueDate: row.revenue_date as string,
            contractReference: row.contract_reference as string | null,
            invoiceNumber: row.invoice_number as string | null,
            isRecurring: row.is_recurring as boolean,
            recurringInterval: row.recurring_interval as ManualRevenue['recurringInterval'],
            attachmentUrl: row.attachment_url as string | null,
            notes: row.notes as string | null,
            status: row.status as 'pending' | 'confirmed' | 'cancelled',
            createdBy: row.created_by as string | null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            company: row.company as ManualRevenue['company'],
            transportadora: row.transportadora as ManualRevenue['transportadora'],
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
    } catch (error) {
        logError('Erro interno ao processar receitas', { error }, 'RevenuesAPI')
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
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
        let carrierId = body.carrierId

        if (profile?.role === 'empresa') {
            companyId = profile.company_id
            carrierId = null
        } else if (profile?.role === 'transportadora' || profile?.role === 'operador') {
            carrierId = profile.transportadora_id
            companyId = null
        }

        // Inserir receita
        const { data, error } = await supabaseAdmin
            .from('gf_manual_revenues')
            .insert({
                company_id: companyId,
                transportadora_id: carrierId,
                category: body.category,
                description: body.description,
                amount: body.amount,
                revenue_date: body.revenueDate,
                contract_reference: body.contractReference,
                invoice_number: body.invoiceNumber,
                is_recurring: body.isRecurring ?? false,
                recurring_interval: body.recurringInterval,
                attachment_url: body.attachmentUrl,
                notes: body.notes,
                status: body.status ?? 'confirmed',
                created_by: userId,
            })
            .select(`
        *,
        company:companies(id, name),
        transportadora:carriers(id, name)
      `)
            .single()

        if (error) {
            logError('Erro ao criar receita', { error, body: { category: body.category, amount: body.amount } }, 'RevenuesAPI')
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        // Mapear retorno para camelCase
        const newRevenue: ManualRevenue = {
            id: data.id,
            companyId: data.company_id,
            carrierId: data.transportadora_id,
            category: data.category,
            description: data.description,
            amount: parseFloat(data.amount),
            revenueDate: data.revenue_date,
            contractReference: data.contract_reference,
            invoiceNumber: data.invoice_number,
            isRecurring: data.is_recurring,
            recurringInterval: data.recurring_interval,
            attachmentUrl: data.attachment_url,
            notes: data.notes,
            status: data.status,
            createdBy: data.created_by,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
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
