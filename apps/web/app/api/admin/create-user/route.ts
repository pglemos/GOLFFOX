import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

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
        const isDevelopment = process.env.NODE_ENV === 'development'
        const authErrorResponse = await requireAuth(request, 'admin')
        if (authErrorResponse && !isDevelopment) {
            return authErrorResponse
        }
        if (authErrorResponse && isDevelopment) {
            console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
        }

        const body = await request.json()
        const { company_id, email, password, name, phone, role } = body

        // Validar e sanitizar dados
        const sanitizedEmail = email?.toString().toLowerCase().trim()
        const sanitizedPassword = password?.toString()
        const sanitizedName = name?.toString().trim()
        const sanitizedPhone = phone?.toString().trim() || null
        const targetRole = role || 'operador'

        // Validações
        if (!company_id) {
            return NextResponse.json({ error: 'company_id é obrigatório' }, { status: 400 })
        }

        if (!sanitizedEmail) {
            return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(sanitizedEmail)) {
            return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
        }

        if (!sanitizedPassword || sanitizedPassword.length < 6) {
            return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
        }

        if (!sanitizedName) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        if (sanitizedPassword.length > 72) {
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
        const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, email')
            .eq('email', sanitizedEmail)
            .maybeSingle()

        if (existingUser) {
            return NextResponse.json({ error: 'Este email já está cadastrado na tabela de usuários' }, { status: 400 })
        }

        // Verificar se email já existe no Auth
        let existingAuthUser: any = null
        try {
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
            existingAuthUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === sanitizedEmail)
        } catch (listError) {
            console.warn('⚠️ Não foi possível verificar usuários no Auth (continuando):', listError)
        }

        console.log(`🔐 Criando usuário (${targetRole}) para empresa ${company.name}...`)

        let authData: any = null
        let createUserError: any = null

        if (existingAuthUser) {
            console.log('   Usando usuário existente no Auth')
            authData = { user: existingAuthUser }
            createUserError = null
        } else {
            try {
                let createResult = await supabaseAdmin.auth.admin.createUser({
                    email: sanitizedEmail,
                    password: sanitizedPassword,
                    email_confirm: true,
                    user_metadata: { name: sanitizedName }
                })

                if (createResult.error && createResult.error.message?.includes('Database error')) {
                    console.warn('⚠️ Erro de banco detectado, tentando abordagem alternativa...')
                    createResult = await supabaseAdmin.auth.admin.createUser({
                        email: sanitizedEmail,
                        password: sanitizedPassword,
                        email_confirm: false
                    })
                }

                authData = createResult.data
                createUserError = createResult.error

                if (createUserError && !authData?.user) {
                    try {
                        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
                        const foundUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === sanitizedEmail)
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

        // Criar registro na tabela users
        const { error: userError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: sanitizedEmail,
                name: sanitizedName,
                phone: sanitizedPhone,
                role: targetRole,
                company_id: company_id,
                is_active: true
            }, { onConflict: 'id' })

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
