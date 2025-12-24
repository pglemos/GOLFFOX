import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { getDocumentsConfig, EntityType } from '@/lib/documents-config'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { documentSchema } from '@/lib/validation/schemas'

interface DocumentHandlerConfig {
    entityType: EntityType
    paramName: string
    entityName: string
    entityTable: string // Tabela da entidade principal (ex: 'transportadoras', 'veiculos')
}

interface RouteParams {
    params: Promise<Record<string, string>>
}

/**
 * Cria handlers genéricos GET/POST/DELETE para rotas de documentos
 * 
 * @example
 * const handlers = createDocumentsHandler({
 *   entityType: 'transportadora',
 *   paramName: 'carrierId',
 *   entityName: 'Transportadora',
 *   entityTable: 'transportadoras'
 * })
 * 
 * export const GET = handlers.GET
 * export const POST = handlers.POST
 * export const DELETE = handlers.DELETE
 */
export function createDocumentsHandler(config: DocumentHandlerConfig) {
    const docConfig = getDocumentsConfig(config.entityType)

    /**
     * GET - Lista todos os documentos de uma entidade
     */
    async function GET(request: NextRequest, { params }: RouteParams) {
        // Verificar autenticação admin
        const authError = await requireAuth(request, 'admin')
        if (authError) return authError

        try {
            const resolvedParams = await params
            const entityId = resolvedParams[config.paramName]

            if (!entityId) {
                return NextResponse.json(
                    { error: `ID da ${config.entityName.toLowerCase()} é obrigatório` },
                    { status: 400 }
                )
            }

            const supabaseAdmin = getSupabaseAdmin()

            // Verificar se entidade existe
            const { data: entity, error: entityError } = await supabaseAdmin
                .from(config.entityTable)
                .select('id')
                .eq('id', entityId)
                .single()

            if (entityError || !entity) {
                return NextResponse.json(
                    { error: `${config.entityName} não encontrada` },
                    { status: 404 }
                )
            }

            // Buscar documentos (selecionar apenas colunas comuns a todas as tabelas de documentos)
            const { data: documents, error } = await supabaseAdmin
                .from(docConfig.table)
                .select('id, document_type, document_number, expiry_date, file_url, file_name, is_valid, created_at, updated_at')
                .eq(docConfig.foreignKey, entityId)
                .order('document_type', { ascending: true })

            if (error) {
                logError('Erro ao buscar documentos', { error, entityId, entityType: config.entityType }, 'DocumentsAPI')
                return NextResponse.json(
                    { error: 'Erro ao buscar documentos' },
                    { status: 500 }
                )
            }

            return NextResponse.json(documents || [])
        } catch (error: unknown) {
            const resolvedParams = await params
            logError('Erro na API de documentos', { 
                error, 
                entityId: resolvedParams[config.paramName], 
                method: 'GET',
                entityType: config.entityType 
            }, 'DocumentsAPI')
            return NextResponse.json(
                { error: 'Erro interno do servidor' },
                { status: 500 }
            )
        }
    }

    /**
     * POST - Adiciona um documento a uma entidade
     */
    async function POST(request: NextRequest, { params }: RouteParams) {
        // Verificar autenticação admin
        const authError = await requireAuth(request, 'admin')
        if (authError) return authError

        try {
            const resolvedParams = await params
            const entityId = resolvedParams[config.paramName]
            const supabaseAdmin = getSupabaseAdmin()

            if (!entityId) {
                return NextResponse.json(
                    { error: `ID da ${config.entityName.toLowerCase()} é obrigatório` },
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

            // Verificar se entidade existe
            const { data: entity, error: entityError } = await supabaseAdmin
                .from(config.entityTable)
                .select('id')
                .eq('id', entityId)
                .single()

            if (entityError || !entity) {
                return NextResponse.json(
                    { error: `${config.entityName} não encontrada` },
                    { status: 404 }
                )
            }

            // Verificar se já existe documento do mesmo tipo
            const { data: existing } = await supabaseAdmin
                .from(docConfig.table)
                .select('id')
                .eq(docConfig.foreignKey, entityId)
                .eq('document_type', documentData.document_type)
                .single()

            if (existing) {
                // Atualizar documento existente
                const existingId = (existing as unknown as { id: string }).id
                const { data: updated, error: updateError } = await supabaseAdmin
                    .from(docConfig.table)
                    .update({
                        ...documentData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', existingId)
                    .select()
                    .single()

                if (updateError) {
                    logError('Erro ao atualizar documento', { 
                        error: updateError, 
                        entityId,
                        entityType: config.entityType 
                    }, 'DocumentsAPI')
                    return NextResponse.json(
                        { error: 'Erro ao atualizar documento' },
                        { status: 500 }
                    )
                }

                return NextResponse.json(updated)
            }

            // Criar novo documento
            const { data: created, error: createError } = await supabaseAdmin
                .from(docConfig.table)
                .insert({
                    [docConfig.foreignKey]: entityId,
                    ...documentData,
                })
                .select()
                .single()

            if (createError) {
                logError('Erro ao criar documento', { 
                    error: createError, 
                    entityId,
                    entityType: config.entityType 
                }, 'DocumentsAPI')
                return NextResponse.json(
                    { error: 'Erro ao criar documento' },
                    { status: 500 }
                )
            }

            return NextResponse.json(created, { status: 201 })
        } catch (error: unknown) {
            const resolvedParams = await params
            logError('Erro na API de documentos', { 
                error, 
                entityId: resolvedParams[config.paramName], 
                method: 'POST',
                entityType: config.entityType 
            }, 'DocumentsAPI')
            return NextResponse.json(
                { error: 'Erro interno do servidor' },
                { status: 500 }
            )
        }
    }

    /**
     * DELETE - Remove um documento de uma entidade
     * Query param: documentId
     */
    async function DELETE(request: NextRequest, { params }: RouteParams) {
        try {
            const resolvedParams = await params
            const entityId = resolvedParams[config.paramName]
            const supabaseAdmin = getSupabaseAdmin()
            const { searchParams } = new URL(request.url)
            const documentId = searchParams.get('documentId')

            if (!entityId || !documentId) {
                return NextResponse.json(
                    { error: `IDs da ${config.entityName.toLowerCase()} e documento são obrigatórios` },
                    { status: 400 }
                )
            }

            // Verificar se documento existe e pertence à entidade
            const { data: document, error: docError } = await supabaseAdmin
                .from(docConfig.table)
                .select('id, file_url')
                .eq('id', documentId)
                .eq(docConfig.foreignKey, entityId)
                .single()

            if (docError || !document) {
                return NextResponse.json(
                    { error: 'Documento não encontrado' },
                    { status: 404 }
                )
            }

            // Remover do banco
            const { error: deleteError } = await supabaseAdmin
                .from(docConfig.table)
                .delete()
                .eq('id', documentId)

            if (deleteError) {
                logError('Erro ao excluir documento', { 
                    error: deleteError, 
                    entityId,
                    entityType: config.entityType 
                }, 'DocumentsAPI')
                return NextResponse.json(
                    { error: 'Erro ao excluir documento' },
                    { status: 500 }
                )
            }

            return NextResponse.json({ success: true })
        } catch (error: unknown) {
            const resolvedParams = await params
            logError('Erro na API de documentos', { 
                error, 
                entityId: resolvedParams[config.paramName], 
                method: 'DELETE',
                entityType: config.entityType 
            }, 'DocumentsAPI')
            return NextResponse.json(
                { error: 'Erro interno do servidor' },
                { status: 500 }
            )
        }
    }

    return { GET, POST, DELETE }
}

