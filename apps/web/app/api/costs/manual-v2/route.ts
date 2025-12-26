/**
 * API: Custos Manuais v2
 * GET - Lista custos com filtros avançados
 * POST - Cria novo custo manual
 * 
 * Suporta: paginação, filtros, ordenação, busca
 */

import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { createCostSchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/supabase'
import type { ManualCost, ManualCostInsert, CostFilters } from '@/types/financial'

// type ProfileRow não é exportado diretamente ou profiles não existe? Assumindo que profiles -> users
type ProfileRow = { role: string; empresa_id: string | null; transportadora_id: string | null }
type ManualCostV2Row = Database['public']['Tables']['gf_manual_costs_v2']['Row']
type ManualCostV2Insert = Database['public']['Tables']['gf_manual_costs_v2']['Insert']

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

        let profile: { role: string; company_id?: string; transportadora_id?: string } | null = null

        if (token) {
            const { data: authData } = await supabaseAdmin.auth.getUser(token)
            if (authData.user) {
                const { data: p } = await supabaseAdmin
                    .from('users') // profiles -> users (geralmente)
                    .select('role, empresa_id, transportadora_id')
                    .eq('id', authData.user.id)
                    .single()
                profile = p ? {
                    role: p.role || 'user',
                    company_id: p.empresa_id || undefined,
                    transportadora_id: p.transportadora_id || undefined
                } : null
            }
        }

        const { searchParams } = new URL(request.url)

        // Parâmetros de paginação
        const page = parseInt(searchParams.get('page') || '1')
        const pageSize = Math.min(parseInt(searchParams.get('page_size') || '20'), 100)
        const offset = (page - 1) * pageSize

        // Filtros
        const filters: CostFilters = {
            category_id: searchParams.get('category_id') || undefined,
            veiculo_id: searchParams.get('veiculo_id') || undefined,
            rota_id: searchParams.get('rota_id') || searchParams.get('route_id') || undefined,
            status: (searchParams.get('status') as CostFilters['status']) || undefined,
            is_recurring: searchParams.get('is_recurring') ? searchParams.get('is_recurring') === 'true' : undefined,
            date_from: searchParams.get('date_from') || undefined,
            date_to: searchParams.get('date_to') || undefined,
            amount_min: searchParams.get('amount_min') ? parseFloat(searchParams.get('amount_min')!) : undefined,
            amount_max: searchParams.get('amount_max') ? parseFloat(searchParams.get('amount_max')!) : undefined,
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
        veiculo:veiculos(id, plate, model),
        rota:rotas(id, name),
        empresa:empresas(id, name),
        transportadora:transportadoras(id, name)
      `, { count: 'exact' })

        // Aplicar filtro de tenant baseado no papel
        if ((profile?.role === 'gestor_empresa' || profile?.role === 'gestor_empresa') && profile.company_id) {
            query = query.eq('empresa_id', profile.company_id)
        } else if ((profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_empresa') && profile.transportadora_id) {
            query = query.eq('transportadora_id', profile.transportadora_id)
        }
        // Admin vê tudo (sem filtro adicional)

        // Aplicar filtros
        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id)
        }
        if (filters.veiculo_id) {
            query = query.eq('veiculo_id', filters.veiculo_id)
        }
        if (filters.rota_id) {
            query = query.eq('rota_id', filters.rota_id)
        }
        if (filters.status) {
            query = query.eq('status', filters.status)
        }
        if (filters.is_recurring !== undefined) {
            query = query.eq('is_recurring', filters.is_recurring)
        }
        if (filters.date_from) {
            query = query.gte('cost_date', filters.date_from)
        }
        if (filters.date_to) {
            query = query.lte('cost_date', filters.date_to)
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
            logError('[API] Erro ao buscar custos', { error }, 'CostsManualV2API')
            // Se a tabela não existe, retornar vazio em vez de erro
            if (error.message?.includes('does not exist') || error.code === 'PGRST205' || error.message?.includes('relation "gf_manual_costs_v2" does not exist')) {
                return NextResponse.json({
                    success: true,
                    data: [],
                    total: 0,
                    page,
                    pageSize,
                    totalPages: 0,
                    message: 'Tabela de custos não encontrada. Execute as migrations.'
                })
            }
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        // Transformar para a interface ManualCost
        const costs: ManualCost[] = (data || []).map((row: ManualCostV2Row & { category?: any; veiculo?: any; rota?: any; empresa?: any; transportadora?: any }) => ({
            id: row.id,
            company_id: row.empresa_id,
            transportadora_id: row.transportadora_id,
            category_id: row.category_id,
            description: row.description,
            amount: parseFloat(row.amount),
            cost_date: row.cost_date,
            is_recurring: row.is_recurring,
            recurring_interval: row.recurring_interval,
            recurring_end_date: row.recurring_end_date,
            parent_recurring_id: row.parent_recurring_id,
            veiculo_id: row.veiculo_id,
            rota_id: row.rota_id,
            motorista_id: row.motorista_id,
            attachment_url: row.attachment_url,
            attachment_name: row.attachment_name,
            notes: row.notes,
            status: row.status,
            created_by: row.created_by,
            approved_by: row.approved_by,
            approved_at: row.approved_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
            category: row.category,
            veiculo: row.veiculo,
            rota: row.rota,
            empresa: row.empresa,
            transportadora: row.transportadora,
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
    } catch (error: unknown) {
        const err = error as { message?: string }
        logError('[API] Erro interno', { error: err }, 'CostsManualV2API')
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

// POST /api/costs/manual-v2
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
            const { data: authData } = await supabaseAdmin.auth.getUser(token)
            if (authData.user) {
                userId = authData.user.id
                const { data: p } = await supabaseAdmin
                    .from('users')
                    .select('role, empresa_id, transportadora_id')
                    .eq('id', authData.user.id)
                    .single()
                profile = p ? {
                    role: p.role || 'user',
                    company_id: p.empresa_id || undefined,
                    transportadora_id: p.transportadora_id || undefined
                } : null
            }
        }

        const body = await request.json()

        // Validar com Zod
        const validation = createCostSchema.safeParse({
            description: body.description,
            amount: body.amount,
            cost_date: body.costDate || body.cost_date,
            category_id: body.categoryId || body.category_id,
            rota_id: body.routeId || body.route_id || body.rota_id,
            veiculo_id: body.vehicleId || body.veiculo_id,
            motorista_id: body.driverId || body.motorista_id,
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
        let companyId = body.company_id || body.companyId
        let transportadoraId = body.transportadora_id || body.carrierId

        if (profile?.role === 'gestor_empresa' || profile?.role === 'gestor_empresa') {
            companyId = profile.company_id || companyId
            transportadoraId = null
        } else if (profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_transportadora' || profile?.role === 'gestor_empresa') {
            transportadoraId = profile.transportadora_id || transportadoraId
            companyId = null
        }
        // Admin pode especificar qualquer tenant

        // Validar constraint chk_tenant: deve ter company_id OU transportadora_id
        if (!companyId && !transportadoraId) {
            return NextResponse.json(
                { success: false, error: 'É necessário especificar uma empresa ou transportadora' },
                { status: 400 }
            )
        }

        // Inserir custo
        const insertData: ManualCostV2Insert = {
            empresa_id: companyId || null,
            transportadora_id: transportadoraId || null,
            category_id: validated.category_id,
            description: validated.description,
            amount: validated.amount,
            cost_date: validated.cost_date,
            is_recurring: validated.is_recurring,
            recurring_interval: validated.recurring_interval,
            recurring_end_date: (body.recurringEndDate || body.recurring_end_date) || null,
            veiculo_id: validated.veiculo_id || null,
            rota_id: validated.rota_id || null,
            motorista_id: validated.motorista_id || null,
            attachment_url: validated.attachment_url || null,
            attachment_name: (body.attachmentName || body.attachment_name) || null,
            notes: validated.notes || null,
            status: validated.status,
            created_by: userId || null,
        }
        const { data, error } = await supabaseAdmin
            .from('gf_manual_costs_v2')
            .insert(insertData)
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

        // Mapear retorno para ManualCost
        const newCost = {
            id: data.id,
            empresa_id: data.empresa_id,
            transportadora_id: data.transportadora_id,
            category_id: data.category_id,
            description: data.description,
            amount: parseFloat(data.amount as unknown as string),
            cost_date: data.cost_date,
            is_recurring: data.is_recurring,
            recurring_interval: data.recurring_interval,
            recurring_end_date: data.recurring_end_date,
            parent_recurring_id: data.parent_recurring_id,
            veiculo_id: data.veiculo_id,
            rota_id: data.rota_id,
            motorista_id: data.motorista_id,
            attachment_url: data.attachment_url,
            attachment_name: data.attachment_name,
            notes: data.notes,
            status: data.status,
            created_by: data.created_by,
            approved_by: data.approved_by,
            approved_at: data.approved_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
            category: data.category,
        } as unknown as ManualCost

        return NextResponse.json({ success: true, data: newCost }, { status: 201 })
    } catch (error) {
        logError('[API] Erro interno', { error }, 'CostsManualV2API')
        return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
