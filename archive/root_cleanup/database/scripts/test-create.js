// Teste completo de criação de transportadora
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../apps/web/.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testCreate() {
    console.log('🧪 TESTE DE CRIAÇÃO DE TRANSPORTADORA\n')

    const testData = {
        name: 'Teste Automatizado ' + Date.now(),
        address: 'Rua Teste, 123',
        phone: '(11) 99999-9999',
        contact_person: 'João Teste',
        email: 'teste@transportadora.com',
        cnpj: '12.345.678/0001-90'
    }

    console.log('📝 Tentando inserir:', testData)
    console.log('')

    const { data, error } = await supabase
        .from('carriers')
        .insert(testData)
        .select()
        .single()

    if (error) {
        console.log('❌ ERRO AO INSERIR:')
        console.log('   Código:', error.code)
        console.log('   Mensagem:', error.message)
        console.log('   Detalhes:', error.details)
        console.log('   Hint:', error.hint)
        console.log('')

        if (error.code === '42501' || error.message.includes('policy')) {
            console.log('⚠️  PROBLEMA: Row Level Security (RLS) bloqueando insert!')
            console.log('   Solução: Adicionar policy para service_role')
        }

        if (error.code === '23505') {
            console.log('⚠️  PROBLEMA: Violação de constraint UNIQUE')
        }

        return false
    } else {
        console.log('✅ SUCESSO! Transportadora criada:')
        console.log('   ID:', data.id)
        console.log('   Nome:', data.name)
        console.log('')

        console.log('🧹 Removendo registro de teste...')
        const { error: deleteError } = await supabase
            .from('carriers')
            .delete()
            .eq('id', data.id)

        if (!deleteError) {
            console.log('✅ Registro de teste removido')
        }

        return true
    }
}

async function testCreateCompany() {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🧪 TESTE DE CRIAÇÃO DE EMPRESA\n')

    const testData = {
        name: 'Empresa Teste ' + Date.now(),
        cnpj: '98.765.432/0001-10',
        email: 'teste@empresa.com',
        phone: '(11) 88888-8888'
    }

    console.log('📝 Tentando inserir:', testData)
    console.log('')

    const { data, error } = await supabase
        .from('companies')
        .insert(testData)
        .select()
        .single()

    if (error) {
        console.log('❌ ERRO AO INSERIR:')
        console.log('   Código:', error.code)
        console.log('   Mensagem:', error.message)
        console.log('   Detalhes:', error.details)
        console.log('')

        if (error.code === '42501' || error.message.includes('policy')) {
            console.log('⚠️  PROBLEMA: Row Level Security (RLS) bloqueando!')
        }

        return false
    } else {
        console.log('✅ SUCESSO! Empresa criada:')
        console.log('   ID:', data.id)
        console.log('   Nome:', data.name)
        console.log('')

        console.log('🧹 Removendo registro de teste...')
        await supabase.from('companies').delete().eq('id', data.id)
        console.log('✅ Registro removido')

        return true
    }
}

async function runTests() {
    const carrierOk = await testCreate()
    const companyOk = await testCreateCompany()

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 RESULTADO FINAL:\n')
    console.log('Transportadora:', carrierOk ? '✅ FUNCIONA' : '❌ ERRO')
    console.log('Empresa:', companyOk ? '✅ FUNCIONA' : '❌ ERRO')
    console.log('')

    if (carrierOk && companyOk) {
        console.log('✅ TUDO FUNCIONANDO!')
        console.log('   O problema deve estar no frontend ou autenticação')
    } else {
        console.log('❌ PROBLEMA NO BACKEND!')
        console.log('   Verificar RLS policies no Supabase')
    }

    return carrierOk && companyOk
}

runTests().then(ok => process.exit(ok ? 0 : 1))
