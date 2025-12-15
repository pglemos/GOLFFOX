import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

// Supabase service client (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

interface RouteParams {
    params: Promise<{ driverId: string }>
}

/**
 * GET /api/admin/drivers/[driverId]/compensation
 * Busca a compensação ativa de um motorista
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { driverId } = await params

        if (!driverId) {
            return NextResponse.json(
                { error: 'ID do motorista é obrigatório' },
                { status: 400 }
            )
        }

        // Verificar se motorista existe
        const { data: driver, error: driverError } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .eq('id', driverId)
            .eq('role', 'motorista')
            .single()

        if (driverError || !driver) {
            return NextResponse.json(
                { error: 'Motorista não encontrado' },
                { status: 404 }
            )
        }

        // Buscar compensação ativa
        const { data: compensation, error } = await supabaseAdmin
            .from('gf_driver_compensation')
            .select('*')
            .eq('driver_id', driverId)
            .eq('is_active', true)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            console.error('Erro ao buscar compensação:', error)
            return NextResponse.json(
                { error: 'Erro ao buscar dados de compensação' },
                { status: 500 }
            )
        }

        return NextResponse.json(compensation || null)
    } catch (error) {
        console.error('Erro na API de compensação:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/drivers/[driverId]/compensation
 * Cria ou atualiza a compensação de um motorista
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { driverId } = await params

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
        const { data: driver, error: driverError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('id', driverId)
            .eq('role', 'motorista')
            .single()

        if (driverError || !driver) {
            return NextResponse.json(
                { error: 'Motorista não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se já existe compensação ativa
        const { data: existing } = await supabaseAdmin
            .from('gf_driver_compensation')
            .select('id')
            .eq('driver_id', driverId)
            .eq('is_active', true)
            .single()

        if (existing) {
            // Atualizar compensação existente
            const { data: updated, error: updateError } = await supabaseAdmin
                .from('gf_driver_compensation')
                .update({
                    ...compensationData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single()

            if (updateError) {
                console.error('Erro ao atualizar compensação:', updateError)
                return NextResponse.json(
                    { error: 'Erro ao atualizar dados de compensação' },
                    { status: 500 }
                )
            }

            return NextResponse.json(updated)
        }

        // Criar nova compensação
        const { data: created, error: createError } = await supabaseAdmin
            .from('gf_driver_compensation')
            .insert({
                driver_id: driverId,
                ...compensationData,
                is_active: true,
            })
            .select()
            .single()

        if (createError) {
            console.error('Erro ao criar compensação:', createError)
            return NextResponse.json(
                { error: 'Erro ao criar dados de compensação' },
                { status: 500 }
            )
        }

        return NextResponse.json(created, { status: 201 })
    } catch (error) {
        console.error('Erro na API de compensação:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/drivers/[driverId]/compensation
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

        // Desativar compensação (soft delete)
        const { error: updateError } = await supabaseAdmin
            .from('gf_driver_compensation')
            .update({
                is_active: false,
                end_date: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString(),
            })
            .eq('driver_id', driverId)
            .eq('is_active', true)

        if (updateError) {
            console.error('Erro ao desativar compensação:', updateError)
            return NextResponse.json(
                { error: 'Erro ao desativar dados de compensação' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro na API de compensação:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
