import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { z } from 'zod'

// Schema de validação
const compensationSchema = z.object({
    base_salary: z.number().positive().optional().nullable(),
    currency: z.string().default('BRL'),
    payment_frequency: z.enum(['weekly', 'biweekly', 'monthly']).default('monthly'),
    contract_type: z.enum(['clt', 'pj', 'autonomo', 'temporario']).default('clt'),
    // Benefits
    has_meal_allowance: z.boolean().default(false),
    meal_allowance_value: z.number().optional().nullable(),
    has_transport_allowance: z.boolean().default(false),
    transport_allowance_value: z.number().optional().nullable(),
    has_health_insurance: z.boolean().default(false),
    health_insurance_value: z.number().optional().nullable(),
    has_dental_insurance: z.boolean().default(false),
    dental_insurance_value: z.number().optional().nullable(),
    has_life_insurance: z.boolean().default(false),
    life_insurance_value: z.number().optional().nullable(),
    has_fuel_card: z.boolean().default(false),
    fuel_card_limit: z.number().optional().nullable(),
    other_benefits: z.string().optional().nullable(),
    // Dates
    start_date: z.string().optional().nullable(),
    end_date: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
})


interface RouteParams {
    params: Promise<{ driverId: string }>
}

/**
 * GET /api/admin/motoristas/[driverId]/compensation
 * Busca a compensação ativa de um motorista
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { driverId } = await params
        const supabaseAdmin = getSupabaseAdmin()

        if (!driverId) {
            return NextResponse.json(
                { error: 'ID do motorista é obrigatório' },
                { status: 400 }
            )
        }

        // Verificar se motorista existe
        const { data: motorista, error: driverError } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .eq('id', driverId)
            .eq('role', 'motorista')
            .single()

        if (driverError || !motorista) {
            return NextResponse.json(
                { error: 'Motorista não encontrado' },
                { status: 404 }
            )
        }

        // Buscar compensação ativa
        const { data: compensation, error } = await supabaseAdmin
            .from('gf_motorista_compensation')
            .select('id, motorista_id, base_salary, currency, payment_frequency, contract_type, has_meal_allowance, meal_allowance_value, has_transport_allowance, transport_allowance_value, has_health_insurance, health_insurance_value, has_dental_insurance, dental_insurance_value, has_life_insurance, life_insurance_value, has_fuel_card, fuel_card_limit, other_benefits, start_date, end_date, is_active, notes, created_at, updated_at')
            .eq('motorista_id', driverId)
            .eq('is_active', true)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            logError('Erro ao buscar compensação', { error, driverId }, 'DriverCompensationAPI')
            return NextResponse.json(
                { error: 'Erro ao buscar dados de compensação' },
                { status: 500 }
            )
        }

        return NextResponse.json(compensation || null)
    } catch (error: any) {
        const { driverId: errorDriverId } = await params
        logError('Erro na API de compensação', { error, driverId: errorDriverId, method: 'GET' }, 'DriverCompensationAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/motoristas/[driverId]/compensation
 * Cria ou atualiza a compensação de um motorista
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    try {
        const { driverId } = await params
        const supabaseAdmin = getSupabaseAdmin()

        if (!driverId) {
            return NextResponse.json(
                { error: 'ID do motorista é obrigatório' },
                { status: 400 }
            )
        }

        const body = await request.json()

        // Validar dados
        const validationResult = compensationSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: validationResult.error.flatten() },
                { status: 400 }
            )
        }

        const compensationData = validationResult.data

        // Verificar se motorista existe
        const { data: motorista, error: driverError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', driverId)
            .eq('role', 'motorista')
            .single()

        if (driverError || !motorista) {
            return NextResponse.json(
                { error: 'Motorista não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se já existe compensação ativa
        const { data: existing } = await supabaseAdmin
            .from('gf_motorista_compensation')
            .select('id')
            .eq('motorista_id', driverId)
            .eq('is_active', true)
            .single()

        if (existing) {
            // Atualizar compensação existente
            const { data: updated, error: updateError } = await (supabaseAdmin
                .from('gf_motorista_compensation') as any)
                .update({
                    ...compensationData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (existing as any).id)
                .select()
                .single()

            if (updateError) {
                logError('Erro ao atualizar compensação', { error: updateError, driverId }, 'DriverCompensationAPI')
                return NextResponse.json(
                    { error: 'Erro ao atualizar dados de compensação' },
                    { status: 500 }
                )
            }

            return NextResponse.json(updated)
        }

        // Criar nova compensação
        const { data: created, error: createError } = await (supabaseAdmin
            .from('gf_motorista_compensation') as any)
            .insert({
                motorista_id: driverId,
                ...compensationData,
                is_active: true,
            })
            .select()
            .single()

        if (createError) {
            logError('Erro ao criar compensação', { error: createError, driverId }, 'DriverCompensationAPI')
            return NextResponse.json(
                { error: 'Erro ao criar dados de compensação' },
                { status: 500 }
            )
        }

        return NextResponse.json(created, { status: 201 })
    } catch (error: any) {
        const { driverId: errorDriverId } = await params
        logError('Erro na API de compensação', { error, driverId: errorDriverId, method: 'POST' }, 'DriverCompensationAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/motoristas/[driverId]/compensation
 * Desativa a compensação de um motorista
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { driverId } = await params

        if (!driverId) {
            return NextResponse.json(
                { error: 'ID do motorista é obrigatório' },
                { status: 400 }
            )
        }

        const supabaseAdmin = getSupabaseAdmin()

        // Desativar compensação (soft delete)
        const { error: updateError } = await (supabaseAdmin
            .from('gf_motorista_compensation') as any)
            .update({
                is_active: false,
                end_date: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
            })
            .eq('motorista_id', driverId)
            .eq('is_active', true)

        if (updateError) {
            logError('Erro ao desativar compensação', { error: updateError, driverId }, 'DriverCompensationAPI')
            return NextResponse.json(
                { error: 'Erro ao desativar dados de compensação' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        const { driverId: errorDriverId } = await params
        logError('Erro na API de compensação', { error, driverId: errorDriverId, method: 'DELETE' }, 'DriverCompensationAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
