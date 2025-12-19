/**
 * API: Custos Manuais v2
 * GET - Lista custos com filtros avançados
 * POST - Cria novo custo manual
 * 
 * Suporta: paginação, filtros, ordenação, busca
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import type { ManualCost, ManualCostInsert, CostFilters } from '@/types/financial'

export const runtime = 'nodejs'

// GET /api/costs/manual-v2
export async function GET(request: NextRequest) {
    try {
        // Requerer autenticação
        const authResponse = await requireAuth(request)
        if (authResponse) return authResponse

        // Obter perfil do usuário a partir do token
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

        // Parâmetros de paginação
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20'), 100)
        const offset = (page - 1) * pageSize

        // Filtros
        const filters: CostFilters = {
            categoryId: searchParams.get('category_id') || undefined,
            vehicleId: searchParams.get('vehicle_id') || undefined,
            routeId: searchParams.get('route_id') || undefined,
            status: (searchParams.get('status') as CostFilters['status']) || undefined,
            isRecurring: searchParams.get('is_recurring') ? searchParams.get('is_recurring') === 'true' : undefined,
            dateFrom: searchParams.get('date_from') || undefined,
            dateTo: searchParams.get('date_to') || undefined,
            amountMin: searchParams.get('amount_min') ? parseFloat(searchParams.get('amount_min')!) : undefined,
            amountMax: searchParams.get('amount_max') ? parseFloat(searchParams.get('amount_max')!) : undefined,
            search: searchParams.get('search') || undefined,
        }

        // Ordenação
        const sortBy = searchParams.get('sort_by') || 'cost_date'
        const sortOrder = searchParams.get('sort_order') === 'asc' ? true : false

        // Construir query
        let query = supabaseAdmin
            .from('gf_manual_costs_v2')
            .select(`
        *,
        category:gf_cost_categories(id, name, icon, color),
        vehicle:vehicles(id, plate, model),
        route:routes(id, name),
        company:companies(id, name),
        carrier:carriers(id, name)
      `, { count: 'exact' })

        // Aplicar filtro de tenant baseado no papel
        if (profile?.role === 'empresa' && profile.company_id) {
            query = query.eq('company_id', profile.company_id)
        } else if ((profile?.role === 'transportadora' || profile?.role === 'operador') && profile.carrier_id) {
            query = query.eq('carrier_id', profile.carrier_id)
        }
        // Admin vê tudo (sem filtro adicional)

        // Aplicar filtros
        if (filters.categoryId) {
            query = query.eq('category_id', filters.categoryId)
        }
        if (filters.vehicleId) {
            query = query.eq('vehicle_id', filters.vehicleId)
        }
        if (filters.routeId) {
            query = query.eq('route_id', filters.routeId)
        }
        if (filters.status) {
            query = query.eq('status', filters.status)
        }
        if (filters.isRecurring !== undefined) {
            query = query.eq('is_recurring', filters.isRecurring)
        }
        if (filters.dateFrom) {
            query = query.gte('cost_date', filters.dateFrom)
        }
        if (filters.dateTo) {
            query = query.lte('cost_date', filters.dateTo)
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
            logError('[API] Erro ao buscar custos', { error }, 'CostsManualV2API')
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
        const costs: ManualCost[] = (data || []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            companyId: row.company_id as string | null,
            carrierId: row.carrier_id as string | null,
            categoryId: row.category_id as string | null,
            description: row.description as string,
            amount: parseFloat(row.amount as string),
            costDate: row.cost_date as string,
            isRecurring: row.is_recurring as boolean,
            recurringInterval: row.recurring_interval as ManualCost['recurringInterval'],
            recurringEndDate: row.recurring_end_date as string | null,
            parentRecurringId: row.parent_recurring_id as string | null,
            vehicleId: row.vehicle_id as string | null,
            routeId: row.route_id as string | null,
            driverId: row.driver_id as string | null,
            attachmentUrl: row.attachment_url as string | null,
            attachmentName: row.attachment_name as string | null,
            notes: row.notes as string | null,
            status: row.status as 'pending' | 'confirmed' | 'cancelled',
            createdBy: row.created_by as string | null,
            approvedBy: row.approved_by as string | null,
            approvedAt: row.approved_at as string | null,
            createdAt: row.created_at as string,
            updatedAt: row.updated_at as string,
            category: row.category as ManualCost['category'],
            vehicle: row.vehicle as ManualCost['vehicle'],
            route: row.route as ManualCost['route'],
            company: row.company as ManualCost['company'],
            carrier: row.carrier as ManualCost['carrier'],
        }))

        const totalPages = count ? Math.ceil(count / pageSize) : 0

        return NextResponse.json({
            success: true,
            data: costs,
            total: count || 0,
            page,
            pageSize,
            totalPages,
        })
    } catch (error) {
        logError('[API] Erro interno', { error }, 'CostsManualV2API')
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// POST /api/costs/manual-v2
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

        const body: ManualCostInsert = await request.json()

        // Validação básica
        if (!body.description || body.amount === undefined || !body.costDate) {
            return NextResponse.json(
                { success: false, error: 'Descrição, valor e data são obrigatórios' },
                { status: 400 }
            )
        }

        if (body.amount < 0) {
            return NextResponse.json(
                { success: false, error: 'Valor não pode ser negativo' },
                { status: 400 }
            )
        }

        // Definir tenant baseado no papel
        let companyId = body.companyId
        let carrierId = body.carrierId

        if (profile?.role === 'empresa') {
            companyId = profile.company_id || body.companyId
            carrierId = null
        } else if (profile?.role === 'transportadora' || profile?.role === 'operador') {
            carrierId = profile.carrier_id || body.carrierId
            companyId = null
        }
        // Admin pode especificar qualquer tenant

        // Validar constraint chk_tenant: deve ter company_id OU carrier_id
        if (!companyId && !carrierId) {
            return NextResponse.json(
                { success: false, error: 'É necessário especificar uma empresa ou transportadora' },
                { status: 400 }
            )
        }

        // Inserir custo
        const { data, error } = await supabaseAdmin
            .from('gf_manual_costs_v2')
            .insert({
                company_id: companyId,
                carrier_id: carrierId,
                category_id: body.categoryId,
                description: body.description,
                amount: body.amount,
                cost_date: body.costDate,
                is_recurring: body.isRecurring ?? false,
                recurring_interval: body.recurringInterval,
                recurring_end_date: body.recurringEndDate,
                vehicle_id: body.vehicleId,
                route_id: body.routeId,
                driver_id: body.driverId,
                attachment_url: body.attachmentUrl,
                attachment_name: body.attachmentName,
                notes: body.notes,
                status: body.status ?? 'confirmed',
                created_by: userId,
            })
            .select(`
        *,
        category:gf_cost_categories(id, name, icon, color)
      `)
            .single()

        if (error) {
            logError('[API] Erro ao criar custo', { error }, 'CostsManualV2API')
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        // Mapear retorno para camelCase
        const newCost: ManualCost = {
            id: data.id,
            companyId: data.company_id,
            carrierId: data.carrier_id,
            categoryId: data.category_id,
            description: data.description,
            amount: parseFloat(data.amount),
            costDate: data.cost_date,
            isRecurring: data.is_recurring,
            recurringInterval: data.recurring_interval,
            recurringEndDate: data.recurring_end_date,
            parentRecurringId: data.parent_recurring_id,
            vehicleId: data.vehicle_id,
            routeId: data.route_id,
            driverId: data.driver_id,
            attachmentUrl: data.attachment_url,
            attachmentName: data.attachment_name,
            notes: data.notes,
            status: data.status,
            createdBy: data.created_by,
            approvedBy: data.approved_by,
            approvedAt: data.approved_at,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            category: data.category,
            vehicle: data.vehicle,
            route: data.route,
            company: data.company,
            carrier: data.carrier,
        }

        return NextResponse.json({ success: true, data: newCost }, { status: 201 })
    } catch (error) {
        logError('[API] Erro interno', { error }, 'CostsManualV2API')
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
