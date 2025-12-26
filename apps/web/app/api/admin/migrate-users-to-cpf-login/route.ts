import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { debug, logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'

// API para migrar usuários antigos para o novo formato de login com CPF
// POST /api/admin/migrate-users-to-cpf-login

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Supabase não configurado')
    }
    return createClient(url, serviceKey)
}

async function migrateUsersToCPFHandler(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()

        // Buscar todos os motoristas e passageiros que têm CPF
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, cpf, role, name')
            .in('role', ['motorista', 'motorista', 'passageiro', 'passageiro', 'funcionario', 'gestor_empresa'])
            .not('cpf', 'is', null)

        if (usersError) {
            return NextResponse.json({ error: usersError.message }, { status: 500 })
        }

        const results = {
            total: users?.length || 0,
            migrated: 0,
            alreadyMigrated: 0,
            errors: [] as string[]
        }

        for (const user of users || []) {
            const cleanCpf = user.cpf?.replace(/\D/g, '') || ''

            if (cleanCpf.length < 11) {
                results.errors.push(`${user.name}: CPF inválido (${user.cpf})`)
                continue
            }

            // Determinar o prefixo do email baseado no role
            let emailPrefix: string
            if (['motorista', 'motorista'].includes(user.role)) {
                emailPrefix = 'motorista'
            } else if (['passageiro', 'passageiro'].includes(user.role)) {
                emailPrefix = 'passageiro'
            } else {
                emailPrefix = 'funcionario'
            }

            const newAuthEmail = `${cleanCpf}@${emailPrefix}.golffox.app`

            // Verificar se já está no formato correto
            try {
                // Buscar usuário no Auth pelo ID
                const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id)

                if (authError || !authUser?.user) {
                    results.errors.push(`${user.name}: Usuário não encontrado no Auth (${user.id})`)
                    continue
                }

                // Verificar se o email já está no formato correto
                if (authUser.user.email === newAuthEmail) {
                    results.alreadyMigrated++
                    continue
                }

                // Gerar nova senha baseada no CPF
                const newPassword = cleanCpf.slice(-6)

                // Atualizar email e senha no Auth
                const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                    email: newAuthEmail,
                    password: newPassword,
                    email_confirm: true
                })

                if (updateError) {
                    results.errors.push(`${user.name}: Erro ao atualizar Auth - ${updateError.message}`)
                    continue
                }

                // Atualizar role na tabela users para o formato português se necessário
                let newRole = user.role
                if (user.role === 'motorista') newRole = 'motorista'
                if (user.role === 'passageiro') newRole = 'passageiro'

                if (newRole !== user.role) {
                    await supabase
                        .from('users')
                        .update({ role: newRole })
                        .eq('id', user.id)
                }

                results.migrated++
                debug('Usuário migrado', { name: user.name, email: newAuthEmail.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'MigrateUsersToCPFAPI')

            } catch (err: unknown) {
                results.errors.push(`${user.name}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Migração concluída. ${results.migrated} usuários migrados.`,
            results
        })
    } catch (error: unknown) {
        logError('Erro na migração', { error }, 'MigrateUsersToCPFAPI')
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}

// GET para ver status
async function getMigrationStatusHandler(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin()

        // Buscar todos os motoristas e passageiros
        const { data: users, error } = await supabase
            .from('users')
            .select('id, email, cpf, role, name')
            .in('role', ['motorista', 'motorista', 'passageiro', 'passageiro', 'funcionario', 'gestor_empresa'])

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        const usersWithStatus = await Promise.all((users || []).map(async (user) => {
            const cleanCpf = user.cpf?.replace(/\D/g, '') || ''

            let emailPrefix = 'funcionario'
            if (['motorista', 'motorista'].includes(user.role)) emailPrefix = 'motorista'
            if (['passageiro', 'passageiro'].includes(user.role)) emailPrefix = 'passageiro'

            const expectedAuthEmail = cleanCpf.length >= 11 ? `${cleanCpf}@${emailPrefix}.golffox.app` : null

            // Buscar email atual no Auth
            let currentAuthEmail = null
            try {
                const { data: authUser } = await supabase.auth.admin.getUserById(user.id)
                currentAuthEmail = authUser?.user?.email
            } catch (e) { }

            return {
                ...user,
                expectedAuthEmail,
                currentAuthEmail,
                needsMigration: expectedAuthEmail && currentAuthEmail !== expectedAuthEmail,
                password: cleanCpf.length >= 6 ? cleanCpf.slice(-6) : null
            }
        }))

        return NextResponse.json({
            total: usersWithStatus.length,
            needsMigration: usersWithStatus.filter(u => u.needsMigration).length,
            users: usersWithStatus
        })
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
