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


// GET - Listar documentos da empresa
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ companyId: string }> }
) {
    try {
        const { companyId } = await context.params

        if (!companyId) {
            return NextResponse.json(
                { error: 'ID da empresa é obrigatório' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('gf_company_documents')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        if (error) {
            logError('Erro ao buscar documentos', { error, companyId }, 'CompanyDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao buscar documentos' },
                { status: 500 }
            )
        }

        return NextResponse.json(data || [])
    } catch (error) {
        logError('Erro interno', { error, companyId, method: 'GET' }, 'CompanyDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// POST - Criar ou atualizar documento
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ companyId: string }> }
) {
    try {
        const { companyId } = await context.params

        if (!companyId) {
            return NextResponse.json(
                { error: 'ID da empresa é obrigatório' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        const body = await request.json()
        const validatedData = documentSchema.parse(body)

        // Verificar se já existe documento deste tipo
        const { data: existing } = await supabase
            .from('gf_company_documents')
            .select('id')
            .eq('company_id', companyId)
            .eq('document_type', validatedData.document_type)
            .single()

        let result
        if (existing) {
            // Atualizar documento existente
            result = await supabase
                .from('gf_company_documents')
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
                .from('gf_company_documents')
                .insert({
                    company_id: companyId,
                    ...validatedData,
                })
                .select()
                .single()
        }

        if (result.error) {
            logError('Erro ao salvar documento', { error: result.error, companyId }, 'CompanyDocumentsAPI')
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
        logError('Erro interno', { error, companyId, method: 'GET' }, 'CompanyDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}

// DELETE - Remover documento
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ companyId: string }> }
) {
    try {
        const { companyId } = await context.params
        const { searchParams } = new URL(request.url)
        const documentId = searchParams.get('documentId')

        if (!companyId || !documentId) {
            return NextResponse.json(
                { error: 'IDs são obrigatórios' },
                { status: 400 }
            )
        }

        const supabase = getSupabaseAdmin()

        const { error } = await supabase
            .from('gf_company_documents')
            .delete()
            .eq('id', documentId)
            .eq('company_id', companyId)

        if (error) {
            logError('Erro ao remover documento', { error, companyId }, 'CompanyDocumentsAPI')
            return NextResponse.json(
                { error: 'Erro ao remover documento' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        logError('Erro interno', { error, companyId, method: 'GET' }, 'CompanyDocumentsAPI')
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        )
    }
}
