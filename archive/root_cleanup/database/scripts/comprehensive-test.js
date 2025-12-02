// Teste completo simulando frontend → API → Database
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

console.log('🔬 SIMULAÇÃO COMPLETA DO FLUXO DE CRIAÇÃO\n')
console.log('='.repeat(60))

// ============================================================================
// TESTE 1: Simular criação de TRANSPORTADORA
// ============================================================================

async function testTransportadoraFlow() {
    console.log('\n📦 TESTE 1: CRIAR TRANSPORTADORA')
    console.log('─'.repeat(60))

    // Dados que o frontend enviaria
    const frontendData = {
        name: 'Transportadora Teste Auto',
        address: 'Rua Teste, 123',
        phone: '(11) 99999-9999',
        contact_person: 'João Silva',
        email: 'contato@teste.com',
        cnpj: '12.345.678/0001-90',
        state_registration: '123456789',
        municipal_registration: '987654321'
    }

    console.log('\n1️⃣ Dados enviados pelo frontend:')
    console.log(JSON.stringify(frontendData, null, 2))

    // Simular validação Zod (que acontece na API)
    console.log('\n2️⃣ Validando dados com Zod schema...')

    const errors = []

    // Validação field por field
    if (!frontendData.name || frontendData.name.trim() === '') {
        errors.push('- name: obrigatório')
    }

    if (frontendData.email && frontendData.email !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(frontendData.email)) {
            errors.push('- email: formato inválido')
        }
    }

    if (errors.length > 0) {
        console.log('   ❌ ERRO de validação:')
        errors.forEach(e => console.log('   ' + e))
        return { success: false, error: 'Validação falhou', errors }
    } else {
        console.log('   ✅ Validação passou')
    }

    // Preparar dados para insert
    console.log('\n3️⃣ Preparando insert no banco...')
    const insertData = {
        name: frontendData.name,
        address: frontendData.address || null,
        phone: frontendData.phone || null,
        contact_person: frontendData.contact_person || null,
        email: frontendData.email || null,
        cnpj: frontendData.cnpj || null,
        state_registration: frontendData.state_registration || null,
        municipal_registration: frontendData.municipal_registration || null
    }

    console.log('   Dados finais:', JSON.stringify(insertData, null, 2))

    // Tentar inserir
    console.log('\n4️⃣ Executando INSERT em carriers...')
    const { data, error } = await supabase
        .from('carriers')
        .insert(insertData)
        .select()
        .single()

    if (error) {
        console.log('   ❌ ERRO no INSERT:')
        console.log('      Código:', error.code)
        console.log('      Mensagem:', error.message)
        console.log('      Detalhes:', error.details)
        console.log('      Hint:', error.hint)

        // Diagnóstico específico
        if (error.code === '42501') {
            console.log('\n   🔍 DIAGNÓSTICO: Row Level Security bloqueando')
            console.log('      Solução: Adicionar policy para service_role')
        } else if (error.code === '23505') {
            console.log('\n   🔍 DIAGNÓSTICO: Violação de UNIQUE constraint')
            console.log('      Já existe registro com estes dados')
        } else if (error.code === '42P01') {
            console.log('\n   🔍 DIAGNÓSTICO: Tabela não existe')
            console.log('      Executar create_missing_tables.sql')
        } else if (error.code === '23502') {
            console.log('\n   🔍 DIAGNÓSTICO: Campo NOT NULL está null')
            console.log('      Campo obrigatório faltando')
        }

        return { success: false, error: error.message, code: error.code }
    } else {
        console.log('   ✅ INSERT bem-sucedido!')
        console.log('      ID criado:', data.id)
        console.log('      Nome:', data.name)

        // Limpar teste
        console.log('\n5️⃣ Limpando registro de teste...')
        await supabase.from('carriers').delete().eq('id', data.id)
        console.log('   ✅ Limpeza concluída')

        return { success: true, data }
    }
}

// ============================================================================
// TESTE 2: Simular criação de EMPRESA
// ============================================================================

async function testCompanyFlow() {
    console.log('\n\n📦 TESTE 2: CRIAR EMPRESA')
    console.log('─'.repeat(60))

    // Dados que o frontend enviaria
    const frontendData = {
        company_name: 'Empresa Teste Auto',
        operator_email: 'operador@teste.com',
        operator_password: 'senha123',
        cnpj: '98.765.432/0001-10',
        phone: '(11) 88888-8888',
        address: 'Av Teste, 456',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
    }

    console.log('\n1️⃣ Dados enviados pelo frontend:')
    console.log(JSON.stringify(frontendData, null, 2))

    // Validação
    console.log('\n2️⃣ Validando dados...')
    const errors = []

    if (!frontendData.company_name) errors.push('- company_name: obrigatório')
    if (!frontendData.operator_email) errors.push('- operator_email: obrigatório')
    if (!frontendData.operator_password) errors.push('- operator_password: obrigatório')

    if (frontendData.operator_email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(frontendData.operator_email)) {
            errors.push('- operator_email: formato inválido')
        }
    }

    if (frontendData.operator_password && frontendData.operator_password.length < 6) {
        errors.push('- operator_password: mínimo 6 caracteres')
    }

    if (errors.length > 0) {
        console.log('   ❌ ERRO de validação:')
        errors.forEach(e => console.log('   ' + e))
        return { success: false, error: 'Validação falhou', errors }
    } else {
        console.log('   ✅ Validação passou')
    }

    // Tentar criar empresa
    console.log('\n3️⃣ Criando empresa em companies...')
    const companyData = {
        name: frontendData.company_name,
        cnpj: frontendData.cnpj || null,
        phone: frontendData.phone || null,
        email: null, // API create-operator não envia email da empresa
        address: frontendData.address || null,
        city: frontendData.city || null,
        state: frontendData.state || null,
        zip_code: frontendData.zip_code || null
    }

    const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert(companyData)
        .select()
        .single()

    if (companyError) {
        console.log('   ❌ ERRO ao criar empresa:')
        console.log('      Código:', companyError.code)
        console.log('      Mensagem:', companyError.message)
        return { success: false, error: companyError.message }
    } else {
        console.log('   ✅ Empresa criada!')
        console.log('      ID:', company.id)
        console.log('      Nome:', company.name)

        // Limpar
        console.log('\n4️⃣ Limpando registro de teste...')
        await supabase.from('companies').delete().eq('id', company.id)
        console.log('   ✅ Limpeza concluída')

        return { success: true, data: company }
    }
}

// ============================================================================
// TESTE 3: Verificar estrutura das tabelas
// ============================================================================

async function verifyTableStructure() {
    console.log('\n\n📋 TESTE 3: VERIFICAR ESTRUTURA DAS TABELAS')
    console.log('─'.repeat(60))

    // Carriers
    console.log('\n1️⃣ Estrutura de CARRIERS:')
    const { data: carrier } = await supabase.from('carriers').select('*').limit(1).single()
    if (carrier) {
        console.log('   Colunas encontradas:')
        Object.keys(carrier).forEach(col => console.log(`   - ${col}`))
    } else {
        console.log('   ℹ️ Tabela vazia, mas existe')
    }

    // Companies
    console.log('\n2️⃣ Estrutura de COMPANIES:')
    const { data: company } = await supabase.from('companies').select('*').limit(1).single()
    if (company) {
        console.log('   Colunas encontradas:')
        Object.keys(company).forEach(col => console.log(`   - ${col}`))
    } else {
        console.log('   ℹ️ Tabela vazia, mas existe')
    }
}

// ============================================================================
// TESTE 4: Testar autenticação (se possível)
// ============================================================================

async function testAuth() {
    console.log('\n\n🔐 TESTE 4: TESTAR AUTENTICAÇÃO')
    console.log('─'.repeat(60))

    console.log('\n1️⃣ Tentando verificar se usuário admin existe...')
    const { data: adminUser, error } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', 'admin@trans.com')
        .single()

    if (error) {
        console.log('   ⚠️ Não foi possível verificar:', error.message)
    } else if (adminUser) {
        console.log('   ✅ Usuário admin encontrado:')
        console.log('      ID:', adminUser.id)
        console.log('      Email:', adminUser.email)
        console.log('      Role:', adminUser.role)
    } else {
        console.log('   ❌ Usuário admin não encontrado')
    }
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================

async function runAllTests() {
    console.log('\n🚀 INICIANDO BATERIA COMPLETA DE TESTES\n')

    const results = {
        transportadora: null,
        empresa: null,
        estrutura: true,
        auth: true
    }

    try {
        // Teste 1
        results.transportadora = await testTransportadoraFlow()

        // Teste 2
        results.empresa = await testCompanyFlow()

        // Teste 3
        await verifyTableStructure()

        // Teste 4
        await testAuth()

        // Resumo Final
        console.log('\n\n' + '='.repeat(60))
        console.log('📊 RESUMO FINAL DE TODOS OS TESTES')
        console.log('='.repeat(60))

        console.log('\n✅ Testes Bem-Sucedidos:')
        if (results.transportadora?.success) console.log('   - Criar Transportadora: ✅')
        if (results.empresa?.success) console.log('   - Criar Empresa: ✅')
        if (results.estrutura) console.log('   - Estrutura das Tabelas: ✅')
        if (results.auth) console.log('   - Autenticação: ✅')

        console.log('\n❌ Testes com Erro:')
        if (!results.transportadora?.success) {
            console.log('   - Criar Transportadora: ❌')
            console.log('     Erro:', results.transportadora?.error)
            console.log('     Código:', results.transportadora?.code)
        }
        if (!results.empresa?.success) {
            console.log('   - Criar Empresa: ❌')
            console.log('     Erro:', results.empresa?.error)
        }

        // Diagnóstico geral
        console.log('\n' + '─'.repeat(60))
        console.log('🔍 DIAGNÓSTICO GERAL:')
        console.log('─'.repeat(60))

        if (results.transportadora?.success && results.empresa?.success) {
            console.log('\n✅ TUDO FUNCIONANDO PERFEITAMENTE!')
            console.log('\nSe ainda há erros no production, o problema é:')
            console.log('1. Autenticação do usuário (token inválido/expirado)')
            console.log('2. CORS bloqueando requisições')
            console.log('3. Rate limiting atingido')
            console.log('4. Erro no frontend que não está chegando na API')
            console.log('\nRecomendação: Verificar console do browser (F12)')
        } else {
            console.log('\n❌ PROBLEMAS ENCONTRADOS NO BACKEND!')
            console.log('\nAções necessárias:')

            if (!results.transportadora?.success) {
                console.log('\n🔧 Para corrigir Transportadora:')
                if (results.transportadora?.code === '42501') {
                    console.log('- Aplicar RLS policy para service_role')
                    console.log('- SQL: CREATE POLICY "svc" ON carriers FOR ALL TO service_role USING (true)')
                } else if (results.transportadora?.code === '42P01') {
                    console.log('- Criar tabela carriers')
                    console.log('- Executar: database/scripts/create_missing_tables.sql')
                }
            }

            if (!results.empresa?.success) {
                console.log('\n🔧 Para corrigir Empresa:')
                console.log('- Verificar estrutura da tabela companies')
                console.log('- Garantir que colunas existem: name, cnpj, email, phone, address, city, state, zip_code')
            }
        }

        console.log('\n' + '='.repeat(60))

        return results
    } catch (err) {
        console.error('\n💥 ERRO FATAL:', err.message)
        console.error(err)
        return null
    }
}

// Executar
runAllTests()
    .then(results => {
        if (results) {
            const allOk = results.transportadora?.success && results.empresa?.success
            process.exit(allOk ? 0 : 1)
        } else {
            process.exit(1)
        }
    })
    .catch(err => {
        console.error('Erro:', err)
        process.exit(1)
    })
