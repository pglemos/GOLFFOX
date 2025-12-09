import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

// Supabase service client (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

interface RouteParams {
    params: Promise<{ carrierId: string }>
}

/**
 * GET /api/admin/carriers/[carrierId]/documents
 * Lista todos os documentos de uma transportadora
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { carrierId } = await params

        if (!carrierId) {
            return NextResponse.json(
                { error: 'ID da transportadora é obrigatório' },
                { status: 400 }
            )
        }

        // Verificar se transportadora existe
        const { data: carrier, error: carrierError } = await supabaseAdmin
            .from('carriers')
            .select('id, name')
            .eq('id', carrierId)
            .single()

        if (carrierError || !carrier) {
            return NextResponse.json(
                { error: 'Transportadora não encontrada' },
                { status: 404 }
            )
        }

        // Buscar documentos
        const { data: documents, error } = await supabaseAdmin
            .from('gf_carrier_documents')
            .select('*')
            .eq('carrier_id', carrierId)
            .order('document_type', { ascending: true })

        if (error) {
            console.error('Erro ao buscar documentos:', error)
            return NextResponse.json(
                { error: 'Erro ao buscar documentos' },
                { status: 500 }
            )
        }

        return NextResponse.json(documents || [])
    } catch (error) {
        console.error('Erro na API de documentos:', error)
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
    try {
        const { carrierId } = await params

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
        const { data: carrier, error: carrierError } = await supabaseAdmin
            .from('carriers')
            .select('id')
            .eq('id', carrierId)
            .single()

        if (carrierError || !carrier) {
            return NextResponse.json(
                { error: 'Transportadora não encontrada' },
                { status: 404 }
            )
        }

        // Verificar se já existe documento do mesmo tipo
        const { data: existing } = await supabaseAdmin
            .from('gf_carrier_documents')
            .select('id')
            .eq('carrier_id', carrierId)
            .eq('document_type', documentData.document_type)
            .single()

        if (existing) {
            // Atualizar documento existente
            const { data: updated, error: updateError } = await supabaseAdmin
                .from('gf_carrier_documents')
                .update({
                    ...documentData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', existing.id)
                .select()
                .single()

            if (updateError) {
                console.error('Erro ao atualizar documento:', updateError)
                return NextResponse.json(
                    { error: 'Erro ao atualizar documento' },
                    { status: 500 }
                )
            }

            return NextResponse.json(updated)
        }

        // Criar novo documento
        const { data: created, error: createError } = await supabaseAdmin
            .from('gf_carrier_documents')
            .insert({
                carrier_id: carrierId,
                ...documentData,
            })
            .select()
            .single()

        if (createError) {
            console.error('Erro ao criar documento:', createError)
            return NextResponse.json(
                { error: 'Erro ao criar documento' },
                { status: 500 }
            )
        }

        return NextResponse.json(created, { status: 201 })
    } catch (error) {
        console.error('Erro na API de documentos:', error)
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
            .from('gf_carrier_documents')
            .select('id, file_url')
            .eq('id', documentId)
            .eq('carrier_id', carrierId)
            .single()

        if (docError || !document) {
            return NextResponse.json(
                { error: 'Documento não encontrado' },
                { status: 404 }
            )
        }

        // Remover do banco
        const { error: deleteError } = await supabaseAdmin
            .from('gf_carrier_documents')
            .delete()
            .eq('id', documentId)

        if (deleteError) {
            console.error('Erro ao excluir documento:', deleteError)
            return NextResponse.json(
                { error: 'Erro ao excluir documento' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro na API de documentos:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
