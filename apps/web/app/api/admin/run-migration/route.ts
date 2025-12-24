
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Supabase não configurado')
    }
    return createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
}

interface ColumnCheck {
    table: string
    column: string
}

const COLUMNS_TO_CHECK: ColumnCheck[] = [
    // Users
    { table: 'users', column: 'address_zip_code' },
    { table: 'users', column: 'address_street' },
    { table: 'users', column: 'address_number' },
    { table: 'users', column: 'address_neighborhood' },
    { table: 'users', column: 'address_complement' },
    { table: 'users', column: 'address_city' },
    { table: 'users', column: 'address_state' },
    { table: 'users', column: 'cnh' },
    { table: 'users', column: 'cnh_category' },

    // Veículos
    { table: 'veiculos', column: 'chassis' },
    { table: 'veiculos', column: 'renavam' },
    { table: 'veiculos', column: 'color' },
    { table: 'veiculos', column: 'fuel_type' },
    { table: 'veiculos', column: 'veiculo_type' },
    { table: 'veiculos', column: 'transportadora_id' },
]

export async function GET() {
    try {
        const supabase = getSupabaseAdmin()
        const results = []

        for (const check of COLUMNS_TO_CHECK) {
            try {
                // Tenta selecionar a coluna (sem retornar dados)
                const { error } = await supabase
                    .from(check.table)
                    .select(check.column)
                    .limit(0)

                if (error && error.message.includes('does not exist')) {
                    results.push({
                        table: check.table,
                        column: check.column,
                        status: 'needs_creation'
                    })
                } else if (error) {
                    // Outro erro (ex: tabela não existe, erro de permissão)
                    // Assumir que se erro não é "does not exist", pode ser problema de acesso ou coluna não existe
                    // Em Postgres, erro de coluna inexistente geralmente é explícito
                    logError(`Erro ao verificar ${check.table}.${check.column}`, { error }, 'RunMigration')
                    results.push({
                        table: check.table,
                        column: check.column,
                        status: 'needs_creation' // Por segurança, se der erro assumir que precisa criar/verificar
                    })
                } else {
                    results.push({
                        table: check.table,
                        column: check.column,
                        status: 'exists'
                    })
                }
            } catch (err) {
                results.push({
                    table: check.table,
                    column: check.column,
                    status: 'error'
                })
            }
        }

        return NextResponse.json({
            success: true,
            results
        })
    } catch (error: unknown) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
