import { createDocumentsHandler } from '@/lib/api/documents-handler'

const handlers = createDocumentsHandler({
    entityType: 'veiculo',
    paramName: 'vehicleId',
    entityName: 'Veículo',
    entityTable: 'veiculos',
})

export const GET = handlers.GET
export const POST = handlers.POST
export const DELETE = handlers.DELETE
