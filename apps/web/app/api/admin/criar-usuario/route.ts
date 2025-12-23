import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
    try {
        const authErrorResponse = await requireAuth(request, 'admin')
        if (authErrorResponse) {
            return authErrorResponse
        }

        const body = await request.json()
        const {
            company_id,
            email,
            password,
            name,
            phone,
            role,
            cpf,
            address_zip_code,
            address_street,
            address_number,
            address_neighborhood,
            address_complement,
            address_city,
            address_state
        } = body

        if (!company_id) return NextResponse.json({ error: 'company_id é obrigatório' }, { status: 400 })
        if (!name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        if (!email && !cpf) return NextResponse.json({ error: 'Email ou CPF é obrigatório' }, { status: 400 })

        const createdUser = await UserService.createUser({
            company_id,
            email: email || '', // Service takes care of generating email from CPF if needed, but type expects string
            password,
            name,
            phone,
            role,
            cpf,
            address_zip_code,
            address_street,
            address_number,
            address_neighborhood,
            address_complement,
            address_city,
            address_state
        })

        return NextResponse.json({
            success: true,
            message: 'Usuário criado com sucesso',
            user: createdUser
        })

    } catch (error: any) {
        logError('Erro ao criar usuário', { error }, 'CreateUserAPI')
        // Mapear erros conhecidos para status 400
        const message = error.message
        const status = message.includes('obrigatório') || message.includes('já está cadastrado') || message.includes('inválido') ? 400 : 500

        return NextResponse.json({ error: 'Erro ao criar usuário', message }, { status })
    }
}
