// Verificar tabelas existentes no Supabase
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não encontradas!')
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida')
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Definida' : '❌ Não definida')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTables() {
    console.log('🔍 Verificando tabelas no Supabase...\n')
    console.log('📊 URL:', supabaseUrl)
    console.log('')

    const tablesToCheck = [
        'carriers',
        'companies',
        'users',
        'gf_audit_log',
        'gf_user_company_map'
    ]

    const results = {}

    for (const table of tablesToCheck) {
        try {
            console.log(`Verificando tabela: ${table}...`)

            // Tentar fazer uma query simples
            const { data, error, count } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true })
                .limit(1)

            if (error) {
                if (error.message.includes('does not exist') || error.code === '42P01') {
                    results[table] = {
                        exists: false,
                        error: 'Tabela não existe'
                    }
                    console.log(`  ❌ ${table}: NÃO EXISTE`)
                } else {
                    results[table] = {
                        exists: 'unknown',
                        error: error.message
                    }
                    console.log(`  ⚠️  ${table}: Erro - ${error.message}`)
                }
            } else {
                results[table] = {
                    exists: true,
                    count: count || 0
                }
                console.log(`  ✅ ${table}: EXISTE (${count || 0} registros)`)
            }
        } catch (err) {
            results[table] = {
                exists: 'unknown',
                error: err.message
            }
            console.log(`  ⚠️  ${table}: Exceção - ${err.message}`)
        }
        console.log('')
    }

    // Resumo
    console.log('━'.repeat(60))
    console.log('📋 RESUMO:')
    console.log('━'.repeat(60))

    const existing = Object.entries(results).filter(([_, v]) => v.exists === true)
    const missing = Object.entries(results).filter(([_, v]) => v.exists === false)
    const unknown = Object.entries(results).filter(([_, v]) => v.exists === 'unknown')

    console.log(`\n✅ Tabelas Existentes (${existing.length}):`)
    existing.forEach(([table, info]) => {
        console.log(`   - ${table} (${info.count} registros)`)
    })

    console.log(`\n❌ Tabelas Faltando (${missing.length}):`)
    if (missing.length > 0) {
        missing.forEach(([table]) => {
            console.log(`   - ${table}`)
        })
    } else {
        console.log('   Nenhuma')
    }

    console.log(`\n⚠️  Status Desconhecido (${unknown.length}):`)
    if (unknown.length > 0) {
        unknown.forEach(([table, info]) => {
            console.log(`   - ${table}: ${info.error}`)
        })
    } else {
        console.log('   Nenhuma')
    }

    // Verificar estrutura da tabela users
    if (results.users?.exists) {
        console.log('\n━'.repeat(60))
        console.log('🔍 Verificando estrutura da tabela USERS:')
        console.log('━'.repeat(60))

        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .limit(1)
                .single()

            if (userError) {
                console.log('⚠️  Não foi possível obter estrutura:', userError.message)
            } else if (userData) {
                console.log('\nColunas encontradas:')
                Object.keys(userData).forEach(col => {
                    console.log(`  - ${col}`)
                })
            } else {
                console.log('ℹ️  Tabela users está vazia, não foi possível verificar estrutura')
            }
        } catch (err) {
            console.log('⚠️  Erro ao verificar estrutura:', err.message)
        }
    }

    // Decisão
    console.log('\n━'.repeat(60))
    console.log('🎯 DECISÃO:')
    console.log('━'.repeat(60))

    if (missing.length > 0) {
        console.log(`\n❗ AÇÃO NECESSÁRIA: ${missing.length} tabela(s) precisam ser criadas`)
        console.log('\nExecute o script SQL:')
        console.log('  database/scripts/create_missing_tables.sql')
        console.log('\nOu execute este script novamente com flag --migrate:')
        console.log('  node database/scripts/verify-tables.js --migrate')
        return false
    } else {
        console.log('\n✅ Todas as tabelas necessárias existem!')
        console.log('✅ Sistema está pronto para uso')
        return true
    }
}

// Executar
checkTables()
    .then((allGood) => {
        console.log('')
        process.exit(allGood ? 0 : 1)
    })
    .catch((err) => {
        console.error('\n❌ Erro fatal:', err.message)
        console.error(err)
        process.exit(1)
    })
