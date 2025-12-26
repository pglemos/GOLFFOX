import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, driverCompensationSchema, uuidSchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

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

        // Validar ID
        const idValidation = uuidSchema.safeParse(driverId)
        if (!idValidation.success) {
            return validationErrorResponse('ID do motorista inválido')
        }

        const supabaseAdmin = getSupabaseAdmin()

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
            .select('id, driver_id, base_salary, currency, payment_frequency, contract_type, has_meal_allowance, meal_allowance_value, has_transport_allowance, transport_allowance_value, has_health_insurance, health_insurance_value, has_dental_insurance, dental_insurance_value, has_life_insurance, life_insurance_value, has_fuel_card, fuel_card_limit, other_benefits, start_date, end_date, notes, is_active, created_at, updated_at')
            .eq('driver_id', driverId)
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
    } catch (error: unknown) {
        logError('Erro na API de compensação', { error, method: 'GET' }, 'DriverCompensationAPI')
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

        // Validar ID
        const idValidation = uuidSchema.safeParse(driverId)
        if (!idValidation.success) {
            return validationErrorResponse('ID do motorista inválido')
        }

        const body = await request.json()

        // Validar dados com Zod centralizado
        const validation = validateWithSchema(driverCompensationSchema, body)
        if (!validation.success) {
            return validationErrorResponse(validation.error)
        }

        const compensationData = validation.data
        const supabaseAdmin = getSupabaseAdmin()

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
            .eq('driver_id', driverId)
            .eq('is_active', true)
            .single()

        if (existing) {
            // Atualizar compensação existente
            const updateData = {
                ...compensationData,
                updated_at: new Date().toISOString(),
            }
            const { data: updated, error: updateError } = await supabaseAdmin
                .from('gf_motorista_compensation')
                .update(updateData)
                .eq('id', existing.id)
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
        const insertData = {
            driver_id: driverId,
            ...compensationData,
            is_active: true,
        }
        const { data: created, error: createError } = await supabaseAdmin
            .from('gf_motorista_compensation')
            .insert(insertData)
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
    } catch (error: unknown) {
        logError('Erro na API de compensação', { error, method: 'POST' }, 'DriverCompensationAPI')
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

        // Validar ID
        const idValidation = uuidSchema.safeParse(driverId)
        if (!idValidation.success) {
            return validationErrorResponse('ID do motorista inválido')
        }

        const supabaseAdmin = getSupabaseAdmin()

        // Desativar compensação (soft delete)
        const updateData = {
            is_active: false,
            end_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
        }
        const { error: updateError } = await supabaseAdmin
            .from('gf_motorista_compensation')
            .update(updateData)
            .eq('driver_id', driverId)
            .eq('is_active', true)

        if (updateError) {
            logError('Erro ao desativar compensação', { error: updateError, driverId }, 'DriverCompensationAPI')
            return NextResponse.json(
                { error: 'Erro ao desativar dados de compensação' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: unknown) {
        logError('Erro na API de compensação', { error, method: 'DELETE' }, 'DriverCompensationAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
