import { createDocumentsHandler } from '@/lib/api/documents-handler'

const handlers = createDocumentsHandler({
    entityType: 'transportadora',
    paramName: 'carrierId',
    entityName: 'Transportadora',
    entityTable: 'transportadoras',
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
