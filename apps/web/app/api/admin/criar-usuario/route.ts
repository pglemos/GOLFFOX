import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { UserService } from '@/lib/services/server/user-service'
import { validateWithSchema, createUserSchema } from '@/lib/validation/schemas'
import { validationErrorResponse, successResponse, errorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

async function postHandler(request: NextRequest) {
    try {
        const authErrorResponse = await requireAuth(request, 'admin')
        if (authErrorResponse) return authErrorResponse

        const body = await request.json()

        // Validar com schema
        const validation = validateWithSchema(createUserSchema, body)
        if (!validation.success) {
            return validationErrorResponse(validation.error)
        }

        const data = validation.data

        const createdUser = await UserService.createUser({
            company_id: data.company_id || data.empresa_id || null,
            email: data.email || '',
            password: data.password || undefined,
            name: data.name,
            phone: data.phone,
            role: data.role,
            cpf: data.cpf,
            address_zip_code: data.address_zip_code ?? undefined,
            address_street: data.address_street ?? undefined,
            address_number: data.address_number ?? undefined,
            address_neighborhood: data.address_neighborhood ?? undefined,
            address_complement: data.address_complement ?? undefined,
            address_city: data.address_city ?? undefined,
            address_state: data.address_state ?? undefined
        })

        return successResponse(createdUser, 201, { message: 'Usuário criado com sucesso' })
    } catch (err) {
        logError('Erro ao criar usuário', { error: err }, 'CreateUserAPI')
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        const status = message.includes('obrigatório') || message.includes('já está cadastrado') || message.includes('inválido') ? 400 : 500

        return errorResponse(err, status as any, 'Erro ao criar usuário')
    }
}

// ✅ SEGURANÇA: Rate limiting para proteção contra abuso
export const POST = withRateLimit(postHandler, 'admin')
