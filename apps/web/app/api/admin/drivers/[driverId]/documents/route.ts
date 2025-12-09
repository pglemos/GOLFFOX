import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Schema de validação para documento
const documentSchema = z.object({
    document_type: z.string().min(1),
    document_number: z.string().nullable().optional(),
    expiry_date: z.string().nullable().optional(),
    issue_date: z.string().nullable().optional(),
    file_url: z.string().url().optional(),
    file_name: z.string().optional(),
    file_size: z.number().optional(),
    file_type: z.string().optional(),
    status: z.enum(['valid', 'expired', 'pending', 'rejected']).default('valid'),
    notes: z.string().nullable().optional(),
})

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase environment variables not configured')
    }

    return createClient(url, key, {
        auth: { persistSession: false }
    })
}

// GET - Listar documentos do motorista
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ driverId: string }> }
) {
    try {
        const { driverId } = await context.params

        if (!driverId) {
            return NextResponse.json(
                { error: 'ID do motorista é obrigatório' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('gf_driver_documents')
            .select('*')
            .eq('driver_id', driverId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erro ao buscar documentos:', error)
            return NextResponse.json(
                { error: 'Erro ao buscar documentos' },
                { status: 500 }
            )
        }

        return NextResponse.json(data || [])
    } catch (error) {
        console.error('Erro interno:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// POST - Criar ou atualizar documento
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ driverId: string }> }
) {
    try {
        const { driverId } = await context.params

        if (!driverId) {
            return NextResponse.json(
                { error: 'ID do motorista é obrigatório' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const validatedData = documentSchema.parse(body)

        const supabase = getSupabaseAdmin()

        // Verificar se já existe documento deste tipo
        const { data: existing } = await supabase
            .from('gf_driver_documents')
            .select('id')
            .eq('driver_id', driverId)
            .eq('document_type', validatedData.document_type)
            .single()

        let result
        if (existing) {
            // Atualizar documento existente
            result = await supabase
                .from('gf_driver_documents')
                .update({
                    ...validatedData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single()
        } else {
            // Criar novo documento
            result = await supabase
                .from('gf_driver_documents')
                .insert({
                    driver_id: driverId,
                    ...validatedData,
                })
                .select()
                .single()
        }

        if (result.error) {
            console.error('Erro ao salvar documento:', result.error)
            return NextResponse.json(
                { error: 'Erro ao salvar documento' },
                { status: 500 }
            )
        }

        return NextResponse.json(result.data)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            )
        }
        console.error('Erro interno:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// DELETE - Remover documento
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ driverId: string }> }
) {
    try {
        const { driverId } = await context.params
        const { searchParams } = new URL(request.url)
        const documentId = searchParams.get('documentId')

        if (!driverId || !documentId) {
            return NextResponse.json(
                { error: 'IDs são obrigatórios' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('gf_driver_documents')
            .delete()
            .eq('id', documentId)
            .eq('driver_id', driverId)

        if (error) {
            console.error('Erro ao remover documento:', error)
            return NextResponse.json(
                { error: 'Erro ao remover documento' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro interno:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
