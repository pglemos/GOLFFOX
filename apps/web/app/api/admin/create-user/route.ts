import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Supabase não configurado')
    }
    return createClient(url, serviceKey)
}

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

        // Validar e sanitizar dados
        const sanitizedEmail = email?.toString().toLowerCase().trim()
        const sanitizedPassword = password?.toString()
        const sanitizedName = name?.toString().trim()
        const sanitizedPhone = phone?.toString().trim() || null
        const targetRole = role || 'operador'
        const sanitizedCpf = cpf?.toString().replace(/\D/g, '') || null

        // Determinar email para Auth (login)
        // Se tem CPF, usar como login. Senão, usar email fornecido
        let authEmail: string
        if (sanitizedCpf && sanitizedCpf.length >= 11) {
            // Login com CPF: email fictício baseado no CPF
            const rolePrefix = targetRole === 'passageiro' ? 'passageiro' : 'funcionario'
            authEmail = `${sanitizedCpf}@${rolePrefix}.golffox.app`
        } else if (sanitizedEmail) {
            authEmail = sanitizedEmail
        } else {
            return NextResponse.json({ error: 'CPF ou Email é obrigatório' }, { status: 400 })
        }

        // Senha: últimos 6 dígitos do CPF ou senha fornecida ou temporária
        let finalPassword: string
        if (sanitizedCpf && sanitizedCpf.length >= 6) {
            finalPassword = sanitizedCpf.slice(-6)
        } else if (sanitizedPassword && sanitizedPassword.length >= 6) {
            finalPassword = sanitizedPassword
        } else {
            finalPassword = `GolfFox${Math.random().toString(36).substring(2, 10)}!`
        }

        // Validações
        if (!company_id) {
            return NextResponse.json({ error: 'company_id é obrigatório' }, { status: 400 })
        }

        if (!sanitizedName) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        // CPF e endereço são opcionais para funcionários
        // if (!sanitizedCpf) {
        //     return NextResponse.json({ error: 'CPF é obrigatório' }, { status: 400 })
        // }

        // if (!address_zip_code || !address_street || !address_number || !address_neighborhood || !address_city || !address_state) {
        //     return NextResponse.json({ error: 'Endereço completo é obrigatório (CEP, rua, número, bairro, cidade e estado)' }, { status: 400 })
        // }

        if (finalPassword.length > 72) {
            return NextResponse.json({ error: 'Senha muito longa (máximo 72 caracteres)' }, { status: 400 })
        }

        const supabaseAdmin = getSupabaseAdmin()

        // Verificar se empresa existe
        const { data: company, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('id, name')
            .eq('id', company_id)
            .single()

        if (companyError || !company) {
            return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
        }

        // Verificar se email já existe na tabela users
        const { data: existingUser, error: existingUserError } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', sanitizedEmail)
            .maybeSingle()



        if (existingUser) {
            return NextResponse.json({ error: 'Este email já está cadastrado na tabela de usuários' }, { status: 400 })
        }

        // Verificar se CPF já existe (opcional, mas recomendado)
        if (sanitizedCpf) {
            const { data: existingCpf } = await supabaseAdmin
                .from('users')
                .select('id')
                .eq('cpf', sanitizedCpf)
                .maybeSingle()

            if (existingCpf) {
                return NextResponse.json({ error: 'Este CPF já está cadastrado' }, { status: 400 })
            }
        }

        // Verificar se email já existe no Auth
        let existingAuthUser: any = null
        try {
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
            existingAuthUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase())
        } catch (listError) {
            logger.warn('⚠️ Não foi possível verificar usuários no Auth (continuando):', listError)
        }

        logger.log(`🔐 Criando usuário (${targetRole}) para empresa ${company.name}...`)

        let authData: any = null
        let createUserError: any = null



        if (existingAuthUser) {
            logger.log('   Usando usuário existente no Auth')
            authData = { user: existingAuthUser }
            createUserError = null
        } else {
            try {
                let createResult = await supabaseAdmin.auth.admin.createUser({
                    email: authEmail,
                    password: finalPassword,
                    email_confirm: true,
                    user_metadata: { name: sanitizedName }
                })

                if (createResult.error && createResult.error.message?.includes('Database error')) {
                    logger.warn('⚠️ Erro de banco detectado, tentando abordagem alternativa...')
                    createResult = await supabaseAdmin.auth.admin.createUser({
                        email: authEmail,
                        password: finalPassword,
                        email_confirm: false
                    })
                }

                authData = createResult.data
                createUserError = createResult.error

                if (createUserError && !authData?.user) {
                    try {
                        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
                        const foundUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase())
                        if (foundUser) {
                            authData = { user: foundUser }
                            createUserError = null
                        }
                    } catch (listErr) { }
                }
            } catch (err: any) {
                createUserError = err
            }
        }

        if (createUserError) {
            return NextResponse.json({
                error: 'Erro ao criar usuário no sistema de autenticação',
                message: createUserError.message
            }, { status: 500 })
        }

        if (!authData?.user) {
            return NextResponse.json({ error: 'Erro ao criar usuário', message: 'Usuário não foi criado no sistema de autenticação' }, { status: 500 })
        }

        const userId = authData.user.id



        // Verificar se o ID já existe na tabela users (para diagnóstico)
        const { data: existingById, error: existingByIdError } = await supabaseAdmin
            .from('users')
            .select('id, email, name')
            .eq('id', userId)
            .maybeSingle()



        // Criar registro na tabela users com colunas de endereço obrigatórias
        const userData: Record<string, any> = {
            id: userId,
            email: sanitizedEmail || null, // Email real do usuário, não o fictício do Auth
            name: sanitizedName,
            phone: sanitizedPhone,
            role: targetRole,
            company_id: company_id,
            is_active: true,
        }
        // Adicionar campos opcionais apenas se fornecidos
        if (sanitizedCpf) userData.cpf = sanitizedCpf
        if (address_zip_code) userData.address_zip_code = address_zip_code
        if (address_street) userData.address_street = address_street
        if (address_number) userData.address_number = address_number
        if (address_neighborhood) userData.address_neighborhood = address_neighborhood
        if (address_complement) userData.address_complement = address_complement
        if (address_city) userData.address_city = address_city
        if (address_state) userData.address_state = address_state

        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert(userData as any, { onConflict: 'id' })

        if (userError) {

            console.error('❌ Erro ao criar registro na tabela users:', userError)
            try { await supabaseAdmin.auth.admin.deleteUser(userId) } catch (e) { }
            return NextResponse.json({ error: 'Erro ao criar registro do usuário', message: userError.message }, { status: 500 })
        }

        // Criar mapeamento na tabela gf_user_company_map (se existir)
        try {
            await supabaseAdmin.from('gf_user_company_map').insert({
                user_id: userId,
                company_id: company_id,
                created_at: new Date().toISOString()
            })
        } catch (mapErr) { }

        return NextResponse.json({
            success: true,
            message: 'Usuário criado com sucesso',
            user: {
                id: userId,
                email: sanitizedEmail,
                name: sanitizedName,
                role: targetRole,
                company_id: company_id
            }
        })

    } catch (error: any) {
        console.error('Erro ao criar usuário:', error)
        return NextResponse.json({ error: 'Erro ao criar usuário', message: error.message }, { status: 500 })
    }
}
