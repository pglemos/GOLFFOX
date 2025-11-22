// Verificação rápida de tabelas
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../apps/web/.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function quickCheck() {
    console.log('VERIFICANDO TABELAS CRÍTICAS:\n')

    // Check carriers
    const { data: carriers, error: carriersError } = await supabase
        .from('carriers')
        .select('*', { count: 'exact', head: true })

    console.log('1. carriers:', carriersError ? '❌ NÃO EXISTE' : '✅ EXISTE')
    if (carriersError) console.log('   Erro:', carriersError.message)

    // Check companies
    const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })

    console.log('2. companies:', companiesError ? '❌ NÃO EXISTE' : '✅ EXISTE')
    if (companiesError) console.log('   Erro:', companiesError.message)

    // Check users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

    console.log('3. users:', usersError ? '❌ NÃO EXISTE' : '✅ EXISTE')
    if (usersError) console.log('   Erro:', usersError.message)

    console.log('\n━'.repeat(40))

    const needsMigration = carriersError || companiesError

    if (needsMigration) {
        console.log('❌ MIGRAÇÃO NECESSÁRIA')
        console.log('\nTabelas faltando precisam ser criadas!')
        console.log('Execute: database/scripts/create_missing_tables.sql')
    } else {
        console.log('✅ TODAS AS TABELAS EXISTEM')
        console.log('\nSistema pronto para uso!')
    }

    return !needsMigration
}

quickCheck().then(ok => process.exit(ok ? 0 : 1))
