import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { z } from 'zod'

// Schema de validação
const documentSchema = z.object({
    document_type: z.string().min(1, 'Tipo de documento é obrigatório'),
    document_number: z.string().optional().nullable(),
    expiry_date: z.string().optional().nullable(),
    issue_date: z.string().optional().nullable(),
    file_url: z.string().url('URL inválida').optional().nullable(),
    file_name: z.string().optional().nullable(),
    file_size: z.number().optional().nullable(),
    file_type: z.string().optional().nullable(),
    status: z.enum(['valid', 'expired', 'pending', 'rejected']).default('valid'),
    notes: z.string().optional().nullable(),
})


interface RouteParams {
    params: Promise<{ carrierId: string }>
}

/**
 * GET /api/admin/carriers/[carrierId]/documents
 * Lista todos os documentos de uma transportadora
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    try {
        const { carrierId } = await params

        if (!carrierId) {
            return NextResponse.json(
                { error: 'ID da transportadora é obrigatório' },
                { status: 400 }
            )
        }

        const supabaseAdmin = getSupabaseAdmin()

        // Verificar se transportadora existe
        const { data: transportadora, error: carrierError } = await supabaseAdmin
            .from('transportadoras' as any)
            .select('id, name')
            .eq('id', carrierId)
            .single()

        if (carrierError || !transportadora) {
            return NextResponse.json(
                { error: 'Transportadora não encontrada' },
                { status: 404 }
            )
        }

        // Buscar documentos
        const { data: documents, error } = await supabaseAdmin
            .from('gf_transportadora_documents' as any)
            .select('id, transportadora_id, document_type, document_number, expiry_date, issue_date, file_url, file_name, file_size, file_type, status, notes, created_at, updated_at')
            .eq('transportadora_id', carrierId)
            .order('document_type', { ascending: true })

        if (error) {
            logError('Erro ao buscar documentos', { error, carrierId }, 'CarrierDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao buscar documentos' },
                { status: 500 }
            )
        }

        return NextResponse.json(documents || [])
    } catch (error: any) {
        const { carrierId: errorCarrierId } = await params
        logError('Erro na API de documentos', { error, carrierId: errorCarrierId, method: 'GET' }, 'CarrierDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/carriers/[carrierId]/documents
 * Adiciona um documento a uma transportadora
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    try {
        const { carrierId } = await params
        const supabaseAdmin = getSupabaseAdmin()

        if (!carrierId) {
            return NextResponse.json(
                { error: 'ID da transportadora é obrigatório' },
                { status: 400 }
            )
        }

        const body = await request.json()

        // Validar dados
        const validationResult = documentSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Dados inválidos', details: validationResult.error.flatten() },
                { status: 400 }
            )
        }

        const documentData = validationResult.data

        // Verificar se transportadora existe
        const { data: transportadora, error: carrierError } = await supabaseAdmin
            .from('transportadoras' as any)
            .select('id')
            .eq('id', carrierId)
            .single()

        if (carrierError || !transportadora) {
            return NextResponse.json(
                { error: 'Transportadora não encontrada' },
                { status: 404 }
            )
        }

        // Verificar se já existe documento do mesmo tipo
        const { data: existing } = await supabaseAdmin
            .from('gf_transportadora_documents' as any)
            .select('id')
            .eq('transportadora_id', carrierId)
            .eq('document_type', documentData.document_type)
            .single()

        if (existing) {
            // Atualizar documento existente
            const existingId = (existing as any).id
            const { data: updated, error: updateError } = await (supabaseAdmin
                .from('gf_transportadora_documents') as any)
                .update({
                    ...documentData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existingId)
                .select()
                .single()

            if (updateError) {
                logError('Erro ao atualizar documento', { error: updateError, carrierId, documentId: existingId }, 'CarrierDocumentsAPI')
                return NextResponse.json(
                    { error: 'Erro ao atualizar documento' },
                    { status: 500 }
                )
            }

            return NextResponse.json(updated)
        }

        // Criar novo documento
        const { data: created, error: createError } = await (supabaseAdmin
            .from('gf_transportadora_documents' as any) as any)
            .insert({
                transportadora_id: carrierId,
                ...documentData,
            })
            .select()
            .single()

        if (createError) {
            logError('Erro ao criar documento', { error: createError, carrierId }, 'CarrierDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao criar documento' },
                { status: 500 }
            )
        }

        return NextResponse.json(created, { status: 201 })
    } catch (error: any) {
        const { carrierId: errorCarrierId } = await params
        logError('Erro na API de documentos', { error, carrierId: errorCarrierId, method: 'POST' }, 'CarrierDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/carriers/[carrierId]/documents
 * Remove um documento de uma transportadora
 * Query param: documentId
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { carrierId } = await params
        const supabaseAdmin = getSupabaseAdmin()
        const { searchParams } = new URL(request.url)
        const documentId = searchParams.get('documentId')

        if (!carrierId || !documentId) {
            return NextResponse.json(
                { error: 'IDs da transportadora e documento são obrigatórios' },
                { status: 400 }
            )
        }

        // Verificar se documento existe e pertence à transportadora
        const { data: document, error: docError } = await supabaseAdmin
            .from('gf_transportadora_documents' as any)
            .select('id, file_url')
            .eq('id', documentId)
            .eq('transportadora_id', carrierId)
            .single()

        if (docError || !document) {
            return NextResponse.json(
                { error: 'Documento não encontrado' },
                { status: 404 }
            )
        }

        // Remover do banco
        const { error: deleteError } = await supabaseAdmin
            .from('gf_transportadora_documents' as any)
            .delete()
            .eq('id', documentId)

        if (deleteError) {
            logError('Erro ao excluir documento', { error: deleteError, carrierId }, 'CarrierDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao excluir documento' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        const { carrierId: errorCarrierId } = await params
        logError('Erro na API de documentos', { error, carrierId: errorCarrierId, method: 'DELETE' }, 'CarrierDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
