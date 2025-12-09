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
    params: Promise<{ vehicleId: string }>
}

/**
 * GET /api/admin/vehicles/[vehicleId]/documents
 * Lista todos os documentos de um veículo
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { vehicleId } = await params

        if (!vehicleId) {
            return NextResponse.json(
                { error: 'ID do veículo é obrigatório' },
                { status: 400 }
            )
        }

        // Verificar se veículo existe
        const { data: vehicle, error: vehicleError } = await supabaseAdmin
            .from('vehicles')
            .select('id, plate')
            .eq('id', vehicleId)
            .single()

        if (vehicleError || !vehicle) {
            return NextResponse.json(
                { error: 'Veículo não encontrado' },
                { status: 404 }
            )
        }

        // Buscar documentos
        const { data: documents, error } = await supabaseAdmin
            .from('gf_vehicle_documents')
            .select('*')
            .eq('vehicle_id', vehicleId)
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
 * POST /api/admin/vehicles/[vehicleId]/documents
 * Adiciona um documento a um veículo
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { vehicleId } = await params

        if (!vehicleId) {
            return NextResponse.json(
                { error: 'ID do veículo é obrigatório' },
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

        // Verificar se veículo existe
        const { data: vehicle, error: vehicleError } = await supabaseAdmin
            .from('vehicles')
            .select('id')
            .eq('id', vehicleId)
            .single()

        if (vehicleError || !vehicle) {
            return NextResponse.json(
                { error: 'Veículo não encontrado' },
                { status: 404 }
            )
        }

        // Verificar se já existe documento do mesmo tipo
        const { data: existing } = await supabaseAdmin
            .from('gf_vehicle_documents')
            .select('id')
            .eq('vehicle_id', vehicleId)
            .eq('document_type', documentData.document_type)
            .single()

        if (existing) {
            // Atualizar documento existente
            const { data: updated, error: updateError } = await supabaseAdmin
                .from('gf_vehicle_documents')
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
            .from('gf_vehicle_documents')
            .insert({
                vehicle_id: vehicleId,
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
 * DELETE /api/admin/vehicles/[vehicleId]/documents
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

        // Verificar se documento existe e pertence ao veículo
        const { data: document, error: docError } = await supabaseAdmin
            .from('gf_vehicle_documents')
            .select('id, file_url')
            .eq('id', documentId)
            .eq('vehicle_id', vehicleId)
            .single()

        if (docError || !document) {
            return NextResponse.json(
                { error: 'Documento não encontrado' },
                { status: 404 }
            )
        }

        // Remover do banco
        const { error: deleteError } = await supabaseAdmin
            .from('gf_vehicle_documents')
            .delete()
            .eq('id', documentId)

        if (deleteError) {
            console.error('Erro ao excluir documento:', deleteError)
            return NextResponse.json(
                { error: 'Erro ao excluir documento' },
                { status: 500 }
            )
        }

        // TODO: Remover arquivo do storage se necessário
        // if (document.file_url) { ... }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Erro na API de documentos:', error)
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
