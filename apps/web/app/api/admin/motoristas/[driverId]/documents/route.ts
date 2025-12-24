import { createDocumentsHandler } from '@/lib/api/documents-handler'

const handlers = createDocumentsHandler({
    entityType: 'motorista',
    paramName: 'driverId',
    entityName: 'Motorista',
    entityTable: 'users',
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
