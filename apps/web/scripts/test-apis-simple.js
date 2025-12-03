#!/usr/bin/env node
/**
 * Script de Teste Simplificado das APIs do Operador
 */

async function testAPIs() {
    console.log('================================================================================')
    console.log('🧪 TESTE DE APIs DO OPERADOR')
    console.log('================================================================================')

    // Teste 1: CSRF Token
    console.log('\n🔍 Teste 1: Obtendo CSRF token...')
    try {
        const response = await fetch('http://localhost:3000/api/auth/csrf')
        const data = await response.json()

        if (response.ok) {
            console.log('✅ CSRF token obtido com sucesso')
            console.log(`   Token: ${data.csrfToken?.substring(0, 20) || data.token?.substring(0, 20)}...`)
        } else {
            console.error('❌ Falha ao obter CSRF token')
            console.error(`   Status: ${response.status}`)
            console.error(`   Resposta: ${JSON.stringify(data)}`)
        }
    } catch (error) {
        console.error('❌ Erro:', error.message)
    }

    // Teste 2: Login
    console.log('\n🔍 Teste 2: Fazendo login...')
    try {
        // Obter CSRF
        const csrfRes = await fetch('http://localhost:3000/api/auth/csrf')
        const csrfData = await csrfRes.json()
        const csrfToken = csrfData.csrfToken || csrfData.token

        if (!csrfToken) {
            throw new Error('CSRF token não encontrado')
        }

        // Fazer login
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-csrf-token': csrfToken,
            },
            body: JSON.stringify({
                email: 'teste@empresa.com',
                password: 'senha123'
            }),
            credentials: 'include'
        })

        const loginData = await loginRes.json()

        if (loginRes.ok) {
            console.log('✅ Login bem-sucedido')
            console.log(`   Usuário: ${loginData.user?.email}`)
            console.log(`   Role: ${loginData.user?.role}`)
            console.log(`   Token: ${loginData.token?.substring(0, 20)}...`)

            // Guardar token para próximos testes
            global.authToken = loginData.token
            global.userId = loginData.user?.id
            global.companyId = loginData.user?.companyId
        } else {
            console.error('❌ Falha no login')
            console.error(`   Status: ${loginRes.status}`)
            console.error(`   Erro: ${loginData.error || loginData.message}`)
            console.error(`   Resposta: ${JSON.stringify(loginData, null, 2)}`)
            return
        }
    } catch (error) {
        console.error('❌ Erro:', error.message)
        return
    }

    // Teste 3: Listar Funcionários
    console.log('\n🔍 Teste 3: GET /api/operador/employees...')
    try {
        const response = await fetch('http://localhost:3000/api/operador/employees', {
            headers: {
                'Authorization': `Bearer ${global.authToken}`
            },
            credentials: 'include'
        })

        const data = await response.json()

        if (response.ok) {
            console.log('✅ Funcionários listados com sucesso')
            console.log(`   Total: ${data.employees?.length || 0}`)
        } else {
            console.error(`❌ Falha - Status: ${response.status}`)
            console.error(`   Resposta: ${JSON.stringify(data, null, 2)}`)
        }
    } catch (error) {
        console.error('❌ Erro:', error.message)
    }

    // Teste 4: Histórico de Rotas
    console.log('\n🔍 Teste 4: GET /api/operador/historico-rotas...')
    try {
        const response = await fetch('http://localhost:3000/api/operador/historico-rotas', {
            headers: {
                'Authorization': `Bearer ${global.authToken}`
            },
            credentials: 'include'
        })

        const data = await response.json()

        if (response.ok) {
            console.log('✅ Histórico obtido com sucesso')
            console.log(`   Execuções: ${data.executions?.length || 0}`)
        } else {
            console.error(`❌ Falha - Status: ${response.status}`)
            console.error(`   Resposta: ${JSON.stringify(data, null, 2)}`)
        }
    } catch (error) {
        console.error('❌ Erro:', error.message)
    }

    console.log('\n================================================================================')
    console.log('📊 Testes concluídos')
    console.log('================================================================================')
}

testAPIs().catch(console.error)
