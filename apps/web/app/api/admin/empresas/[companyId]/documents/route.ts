import { createDocumentsHandler } from '@/lib/api/documents-handler'

const handlers = createDocumentsHandler({
    entityType: 'company',
    paramName: 'companyId',
    entityName: 'Empresa',
    entityTable: 'companies',
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
