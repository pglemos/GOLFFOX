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
    params: Promise<{ vehicleId: string }>
}

/**
 * GET /api/admin/veiculos/[vehicleId]/documents
 * Lista todos os documentos de um veículo
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    try {
        const { vehicleId } = await params

        if (!vehicleId) {
            return NextResponse.json(
                { error: 'ID do veículo é obrigatório' },
                { status: 400 }
            )
        }

        const supabaseAdmin = getSupabaseAdmin()

        // Verificar se veículo existe
        const { data: veiculo, error: vehicleError } = await supabaseAdmin
            .from('veiculos')
            .select('id, plate')
            .eq('id', vehicleId)
            .single()

        if (vehicleError || !veiculo) {
            return NextResponse.json(
                { error: 'Veículo não encontrado' },
                { status: 404 }
            )
        }

        // Buscar documentos
        const { data: documents, error } = await supabaseAdmin
            .from('gf_veiculo_documents' as any)
            .select('*')
            .eq('veiculo_id', vehicleId)
            .order('document_type', { ascending: true })

        if (error) {
            logError('Erro ao buscar documentos', { error, vehicleId }, 'VehicleDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao buscar documentos' },
                { status: 500 }
            )
        }

        return NextResponse.json(documents || [])
    } catch (error) {
        const { vehicleId } = await params
        logError('Erro na API de documentos', { error, vehicleId, method: 'GET' }, 'VehicleDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/veiculos/[vehicleId]/documents
 * Adiciona um documento a um veículo
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    try {
        const { vehicleId } = await params

        if (!vehicleId) {
            return NextResponse.json(
                { error: 'ID do veículo é obrigatório' },
                { status: 400 }
            )
        }

        const supabaseAdmin = getSupabaseAdmin()

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

        // Verificar se veículo existe
        const { data: veiculo, error: vehicleError } = await supabaseAdmin
            .from('veiculos')
            .select('id')
            .eq('id', vehicleId)
            .single()

        if (vehicleError || !veiculo) {
            return NextResponse.json(
                { error: 'Veículo não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se já existe documento do mesmo tipo
        const { data: existing } = await supabaseAdmin
            .from('gf_veiculo_documents' as any)
            .select('id')
            .eq('veiculo_id', vehicleId)
            .eq('document_type', documentData.document_type)
            .single()

        if (existing) {
            // Atualizar documento existente
            const { data: updated, error: updateError } = await (supabaseAdmin
                .from('gf_veiculo_documents') as any)
                .update({
                    ...documentData,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', (existing as any).id)
                .select()
                .single()

            if (updateError) {
                logError('Erro ao atualizar documento', { error: updateError, vehicleId }, 'VehicleDocumentsAPI')
                return NextResponse.json(
                    { error: 'Erro ao atualizar documento' },
                    { status: 500 }
                )
            }

            return NextResponse.json(updated)
        }

        // Criar novo documento
        const { data: created, error: createError } = await (supabaseAdmin
            .from('gf_veiculo_documents') as any)
            .insert({
                veiculo_id: vehicleId,
                ...documentData,
            })
            .select()
            .single()

        if (createError) {
            logError('Erro ao criar documento', { error: createError, vehicleId }, 'VehicleDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao criar documento' },
                { status: 500 }
            )
        }

        return NextResponse.json(created, { status: 201 })
    } catch (error) {
        const { vehicleId } = await params
        logError('Erro na API de documentos', { error, vehicleId, method: 'POST' }, 'VehicleDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/veiculos/[vehicleId]/documents
 * Remove um documento de um veículo
 * Query param: documentId
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { vehicleId } = await params
        const { searchParams } = new URL(request.url)
        const documentId = searchParams.get('documentId')

        if (!vehicleId || !documentId) {
            return NextResponse.json(
                { error: 'IDs do veículo e documento são obrigatórios' },
                { status: 400 }
            )
        }

        const supabaseAdmin = getSupabaseAdmin()

        // Verificar se documento existe e pertence ao veículo
        const { data: document, error: docError } = await supabaseAdmin
            .from('gf_veiculo_documents' as any)
            .select('id, file_url')
            .eq('id', documentId)
            .eq('veiculo_id', vehicleId)
            .single()

        if (docError || !document) {
            return NextResponse.json(
                { error: 'Documento não encontrado' },
                { status: 404 }
            )
        }

        // Remover do banco
        const { error: deleteError } = await supabaseAdmin
            .from('gf_veiculo_documents' as any)
            .delete()
            .eq('id', documentId)

        if (deleteError) {
            logError('Erro ao excluir documento', { error: deleteError, vehicleId }, 'VehicleDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao excluir documento' },
                { status: 500 }
            )
        }

        // TODO: Remover arquivo do storage se necessário
        // if (document.file_url) { ... }

        return NextResponse.json({ success: true })
    } catch (error) {
        const { vehicleId } = await params
        logError('Erro na API de documentos', { error, vehicleId, method: 'DELETE' }, 'VehicleDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
