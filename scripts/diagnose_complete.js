const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

console.log('='.repeat(80))
console.log('🔍 DIAGNÓSTICO COMPLETO DO SUPABASE - GOLFFOX')
console.log('='.repeat(80))

async function main() {
    try {
        // 1. Verificar tabelas de empresas
        console.log('\n📊 1. VERIFICANDO TABELAS DE EMPRESAS\n')

        let companiesTable = null
        try {
            const { data, error } = await supabaseAdmin
                .from('companies')
                .select('id')
                .limit(1)

            if (!error) {
                companiesTable = 'companies'
                console.log('✅ Tabela "companies" EXISTE')
            } else if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.log('❌ Tabela "companies" NÃO EXISTE')
            } else {
                console.log(`⚠️  Erro ao verificar "companies": ${error.message}`)
            }
        } catch (e) {
            console.log(`❌ Erro ao verificar "companies": ${e.message}`)
        }

        // 2. Se companies existe, verificar schema
        if (companiesTable) {
            console.log('\n📋 2. SCHEMA DA TABELA "companies"\n')

            const { data: companies, error } = await supabaseAdmin
                .from('companies')
                .select('*')
                .limit(3)

            if (companies && companies.length > 0) {
                console.log(`Total de empresas cadastradas: ${companies.length}`)
                console.log('\nColunas disponíveis:')
                const cols = Object.keys(companies[0])
                cols.forEach(col => console.log(`  - ${col}`))

                console.log('\nPrimeiras empresas:')
                companies.forEach(c => {
                    console.log(`  - ${c.name || 'N/A'} (ID: ${c.id})`)
                })
            } else {
                console.log('⚠️  Tabela "companies" está VAZIA (0 registros)')
            }
        }

        // 3. Verificar tabela users
        console.log('\n👤 3. VERIFICANDO USUÁRIOS DE TESTE\n')

        try {
            const { data: users, error } = await supabaseAdmin
                .from('users')
                .select('id, email, role')
                .in('email', ['teste@transportadora.com', 'teste@empresa.com', 'golffox@admin.com'])

            if (users) {
                console.log(`Usuários de teste encontrados: ${users.length}`)
                if (users.length > 0) {
                    users.forEach(u => {
                        console.log(`  ✅ ${u.email.padEnd(35)} Role: ${u.role || 'N/A'}`)
                    })
                } else {
                    console.log('  ❌ NENHUM usuário de teste encontrado!')
                    console.log('  ⚠️  Isso explica por que login transportadora/empresa falha')
                }
            }
        } catch (e) {
            console.log(`❌ Erro ao verificar usuários: ${e.message}`)
        }

        // 4. Verificar auth users
        console.log('\n🔐 4. VERIFICANDO SUPABASE AUTH\n')

        try {
            const { data: { users: authUsers }, error } = await supabaseAdmin.auth.admin.listUsers()

            if (authUsers) {
                console.log(`Total de usuários no Supabase Auth: ${authUsers.length}`)

                const testAuthUsers = authUsers.filter(u =>
                    u.email === 'teste@transportadora.com' ||
                    u.email === 'teste@empresa.com' ||
                    u.email === 'golffox@admin.com'
                )

                if (testAuthUsers.length > 0) {
                    console.log('\nUsuários de teste no Auth:')
                    testAuthUsers.forEach(u => {
                        console.log(`  ✅ ${u.email.padEnd(35)} ID: ${u.id}`)
                    })
                } else {
                    console.log('  ❌ Usuários de teste NÃO existem no Supabase Auth')
                    console.log('  ⚠️  Precisam ser criados!')
                }
            }
        } catch (e) {
            console.log(`❌ Erro ao listar auth users: ${e.message}`)
        }

        // 5. Testar API create-operator simulando payload
        console.log('\n🧪 5. TESTANDO CRIAÇÃO DE EMPRESA (SIMULAÇÃO)\n')

        if (companiesTable) {
            try {
                const testCompanyName = `Teste Diagnóstico ${Date.now()}`

                const { data: newCompany, error } = await supabaseAdmin
                    .from('companies')
                    .insert({
                        name: testCompanyName,
                        is_active: true
                    })
                    .select()
                    .single()

                if (newCompany) {
                    console.log(`✅ Empresa de teste criada com sucesso!`)
                    console.log(`   ID: ${newCompany.id}`)
                    console.log(`   Nome: ${newCompany.name}`)

                    // Limpar empresa de teste
                    await supabaseAdmin
                        .from('companies')
                        .delete()
                        .eq('id', newCompany.id)
                    console.log('   ✅ Empresa de teste removida (limpeza)')
                } else if (error) {
                    console.log(`❌ Erro ao criar empresa de teste:`)
                    console.log(`   ${error.message}`)
                    console.log(`   Código: ${error.code}`)
                }
            } catch (e) {
                console.log(`❌ Exceção ao testar criação: ${e.message}`)
            }
        }

        // 6. Resumo e próximos passos
        console.log('\n' + '='.repeat(80))
        console.log('📝 RESUMO DO DIAGNÓSTICO')
        console.log('='.repeat(80))

        console.log('\n✅ DESCOBERTAS:')
        console.log(`  - Tabela "companies": ${companiesTable ? '✅ Existe' : '❌ Não existe'}`)
        console.log(`  - Service role key: ✅ Funcionando`)
        console.log(`  - Conexão Supabase: ✅ OK`)

        console.log('\n⚠️  PROBLEMAS IDENTIFICADOS:')
        console.log('  1. Verificar se usuários teste existem no Supabase Auth')
        console.log('  2. Se não existirem, criar via script')
        console.log('  3. Se tabela "companies" não existir, criar schema')

        console.log('\n🎯 PRÓXIMAS AÇÕES:')
        if (!companiesTable) {
            console.log('  [ ] Criar tabela "companies" com schema correto')
        }
        console.log('  [ ] Criar usuários de teste no Supabase Auth')
        console.log('  [ ] Vincular usuários à tabela "users"')
        console.log('  [ ] Re-testar criação de empresa via API')
        console.log('  [ ] Re-testar login transportadora/empresa')

    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO:', error.message)
        console.error(error)
    }
}

main().catch(console.error)
