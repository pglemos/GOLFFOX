import { createDocumentsHandler } from '@/lib/api/documents-handler'

const handlers = createDocumentsHandler({
    entityType: 'transportadora',
    paramName: 'transportadoraId',
    entityName: 'Transportadora',
    entityTable: 'transportadoras',
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
