import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
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


// GET - Listar documentos do motorista
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ driverId: string }> }
) {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

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
            .from('gf_motorista_documents' as any)
            .select('*')
            .eq('motorista_id', driverId)
            .order('created_at', { ascending: false })

        if (error) {
            logError('Erro ao buscar documentos', { error, driverId }, 'DriverDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao buscar documentos' },
                { status: 500 }
            )
        }

        return NextResponse.json(data || [])
    } catch (error) {
        const { driverId } = await context.params
        logError('Erro interno', { error, driverId, method: 'GET' }, 'DriverDocumentsAPI')
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
            .from('gf_motorista_documents' as any)
            .select('id')
            .eq('motorista_id', driverId)
            .eq('document_type', validatedData.document_type)
            .single()

        let result
        if (existing) {
            // Atualizar documento existente
            result = await (supabase
                .from('gf_motorista_documents' as any) as any)
                .update({
                    ...validatedData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (existing as any).id)
                .select()
                .single()
        } else {
            // Criar novo documento
            result = await (supabase
                .from('gf_motorista_documents' as any) as any)
                .insert({
                    motorista_id: driverId,
                    ...validatedData,
                })
                .select()
                .single()
        }

        if (result.error) {
            logError('Erro ao salvar documento', { error: result.error, driverId }, 'DriverDocumentsAPI')
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
        const { driverId: driverIdError } = await context.params
        logError('Erro interno', { error, driverId: driverIdError, method: 'POST' }, 'DriverDocumentsAPI')
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
            .from('gf_motorista_documents' as any)
            .delete()
            .eq('id', documentId)
            .eq('motorista_id', driverId)

        if (error) {
            logError('Erro ao remover documento', { error, driverId }, 'DriverDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao remover documento' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        const { driverId: driverIdError } = await context.params
        logError('Erro interno', { error, driverId: driverIdError, method: 'DELETE' }, 'DriverDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
