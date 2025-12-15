#!/usr/bin/env node
/**
 * Script para criar usuários de teste
 * Executa via Supabase Service Role
 */

// Tentar carregar dotenv
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('⚠️ dotenv não disponível, usando variáveis de ambiente do sistema')
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Senha padrão para todos os usuários de teste
const DEFAULT_PASSWORD = 'senha123'

const testUsers = [
  {
    email: 'golffox@admin.com',
    password: DEFAULT_PASSWORD,
    name: 'Admin GolfFox',
    role: 'admin',
    company_id: null // Admin não tem company
  },
  {
    email: 'operator@test.com',
    password: DEFAULT_PASSWORD,
    name: 'Operador Teste',
    role: 'operador',
    company_id: null // Será definido após criar empresa
  },
  {
    email: 'passenger@test.com',
    password: DEFAULT_PASSWORD,
    name: 'Passageiro Teste',
    role: 'passageiro',
    company_id: null // Será definido após criar empresa
  },
  // Usuários para App Mobile
  {
    email: 'teste@motorista.com',
    password: DEFAULT_PASSWORD,
    name: 'Motorista Teste',
    role: 'motorista',
    company_id: null // Será definido após criar empresa/transportadora
  },
  {
    email: 'teste@passageiro.com',
    password: DEFAULT_PASSWORD,
    name: 'Passageiro Mobile',
    role: 'passageiro',
    company_id: null // Será definido após criar empresa
  }
]

async function seedUsers() {
  console.log('🌱 Iniciando seed de usuários de teste...')

  try {
    // Verificar se a tabela existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.error('❌ Tabela users não existe')
        console.error('Execute as migrations primeiro!')
        process.exit(1)
      }
      console.warn('⚠️ Aviso ao verificar tabela:', tableError.message)
    }

    // Buscar empresa de teste (primeira empresa ativa)
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('is_active', true)
      .limit(1)

    const companyId = companies && companies.length > 0 ? companies[0].id : null

    if (companyId) {
      console.log(`✅ Empresa encontrada: ${companyId}`)
      // Atualizar company_id para operator e passenger
      testUsers.forEach(user => {
        if (user.role === 'operador' || user.role === 'operator' || user.role === 'passenger') {
          user.company_id = companyId
        }
      })
    } else {
      console.warn('⚠️ Nenhuma empresa ativa encontrada')
      console.warn('   Execute seed-companies.js primeiro ou crie uma empresa manualmente')
    }

    const results = []

    for (const userData of testUsers) {
      try {
        // Verificar se usuário já existe no Supabase Auth
        let existing = null
        try {
          const { data: usersList, error: listError } = await supabase.auth.admin.listUsers()
          if (!listError && usersList?.users) {
            existing = usersList.users.find(u => u.email === userData.email)
          }
        } catch (listErr) {
          console.warn(`⚠️  Erro ao listar usuários: ${listErr.message}`)
        }

        // Se usuário existe, tentar obter pelo email
        if (!existing) {
          try {
            const { data: userByEmail } = await supabase.auth.admin.getUserByEmail(userData.email)
            if (userByEmail?.user) {
              existing = userByEmail.user
            }
          } catch (getErr) {
            // Usuário não existe, continuar para criação
          }
        }

        if (existing) {
          console.log(`⏭️  Usuário já existe: ${userData.email}`)

          // Atualizar perfil na tabela users
          const { error: updateError } = await supabase
            .from('users')
            .upsert({
              id: existing.id,
              email: userData.email,
              name: userData.name,
              role: userData.role,
              company_id: userData.company_id
            }, {
              onConflict: 'id'
            })

          if (updateError) {
            console.error(`   ⚠️  Erro ao atualizar perfil: ${updateError.message}`)
            // Não falhar se erro for de coluna não existente ou similar
            if (!updateError.message.includes('column') && !updateError.message.includes('does not exist')) {
              console.error(`   ❌ Erro crítico ao atualizar perfil`)
            } else {
              console.log(`   ✅ Perfil atualizado (com avisos)`)
            }
          } else {
            console.log(`   ✅ Perfil atualizado na tabela users`)
          }

          results.push({
            email: userData.email,
            status: 'exists',
            id: existing.id,
            userId: existing.id
          })
          continue
        }

        // Tentar criar usuário no Supabase Auth
        let authData = null
        let authError = null

        try {
          const createResult = await supabase.auth.admin.createUser({
            email: userData.email,
            password: userData.password,
            email_confirm: true,
            user_metadata: {
              name: userData.name,
              role: userData.role
            }
          })
          authData = createResult.data
          authError = createResult.error
        } catch (createException) {
          authError = createException
          console.warn(`⚠️  Exceção ao criar usuário ${userData.email}:`, createException.message)
        }

        if (authError) {
          // Se erro for de usuário já existe, tentar obter o usuário
          const isAlreadyExistsError =
            authError.message?.includes('already registered') ||
            authError.message?.includes('already exists') ||
            authError.message?.includes('User already registered') ||
            authError.message?.includes('Database error') // Pode ser erro genérico de banco

          if (isAlreadyExistsError) {
            console.log(`⏭️  Usuário ${userData.email} pode já existir, tentando obter...`)

            // Tentar múltiplas formas de obter o usuário
            let foundUser = null

            // Método 1: getUserByEmail
            try {
              const { data: userByEmail, error: getError } = await supabase.auth.admin.getUserByEmail(userData.email)
              if (userByEmail?.user && !getError) {
                foundUser = userByEmail.user
                console.log(`✅ Usuário encontrado via getUserByEmail: ${foundUser.id}`)
              }
            } catch (getErr) {
              // Ignorar erro
            }

            // Método 2: listUsers e filtrar
            if (!foundUser) {
              try {
                const { data: usersList } = await supabase.auth.admin.listUsers()
                if (usersList?.users) {
                  foundUser = usersList.users.find(u => u.email === userData.email)
                  if (foundUser) {
                    console.log(`✅ Usuário encontrado via listUsers: ${foundUser.id}`)
                  }
                }
              } catch (listErr) {
                // Ignorar erro
              }
            }

            if (foundUser) {
              // Atualizar perfil
              const { error: updateError } = await supabase
                .from('users')
                .upsert({
                  id: foundUser.id,
                  email: userData.email,
                  name: userData.name,
                  role: userData.role,
                  company_id: userData.company_id
                }, {
                  onConflict: 'id'
                })

              if (updateError) {
                console.warn(`   ⚠️  Erro ao atualizar perfil: ${updateError.message}`)
                // Se erro for de coluna não existente, não é crítico
                if (updateError.message.includes('column') || updateError.message.includes('does not exist')) {
                  console.log(`   ✅ Perfil atualizado (com avisos - coluna pode não existir)`)
                }
              } else {
                console.log(`   ✅ Perfil atualizado na tabela users`)
              }

              results.push({
                email: userData.email,
                status: 'exists',
                id: foundUser.id,
                userId: foundUser.id
              })
              continue
            } else {
              // Usuário não encontrado mas erro ao criar - pode ser problema de permissões
              console.error(`❌ Erro ao criar usuário ${userData.email}: ${authError.message}`)
              console.error(`   ⚠️  Usuário não existe mas não foi possível criar. Verifique permissões do service role.`)
              results.push({
                email: userData.email,
                status: 'error',
                error: authError.message
              })
              continue
            }
          } else {
            console.error(`❌ Erro ao criar usuário ${userData.email}:`, authError.message)
            results.push({
              email: userData.email,
              status: 'error',
              error: authError.message
            })
            continue
          }
        }

        if (!authData || !authData.user) {
          console.error(`❌ Erro: dados de autenticação não retornados para ${userData.email}`)
          results.push({
            email: userData.email,
            status: 'error',
            error: 'Dados de autenticação não retornados'
          })
          continue
        }

        // Criar perfil na tabela users
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            company_id: userData.company_id
          })

        if (profileError) {
          console.error(`   ⚠️  Erro ao criar perfil: ${profileError.message}`)
          // Tentar deletar usuário do auth se perfil falhar
          await supabase.auth.admin.deleteUser(authData.user.id)
          results.push({
            email: userData.email,
            status: 'error',
            error: profileError.message
          })
          continue
        }

        console.log(`✅ Usuário criado: ${userData.email} (${userData.role})`)
        results.push({
          email: userData.email,
          status: 'created',
          id: authData.user.id,
          userId: authData.user.id
        })

      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${userData.email}:`, error.message)
        results.push({
          email: userData.email,
          status: 'error',
          error: error.message
        })
      }
    }

    // Resumo
    console.log('\n📊 Resumo do seed:')
    const created = results.filter(r => r.status === 'created').length
    const exists = results.filter(r => r.status === 'exists').length
    const errors = results.filter(r => r.status === 'error').length

    console.log(`   • Criados: ${created}`)
    console.log(`   • Já existem: ${exists}`)
    console.log(`   • Erros: ${errors}`)

    console.log('\n📋 Credenciais de teste:')
    testUsers.forEach(user => {
      const result = results.find(r => r.email === user.email)
      if (result && result.status !== 'error') {
        console.log(`   ${user.email} / ${user.password} (${user.role})`)
      }
    })

    if (errors > 0) {
      console.log('\n⚠️ Seed concluído com erros')
      process.exit(1)
    } else {
      console.log('\n✅ Seed concluído com sucesso!')
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

seedUsers()

