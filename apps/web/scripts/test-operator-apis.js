#!/usr/bin/env node
/**
 * Script de Teste das APIs do Operador
 * Testa todos os endpoints disponíveis para o painel do operador
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_EMAIL = 'teste@empresa.com'
const TEST_PASSWORD = 'senha123'

// Cores para output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`)
}

// Função auxiliar para fazer requisições
async function request(method, endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`
    const { body, headers = {}, expectError = false } = options

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
            body: body ? JSON.stringify(body) : undefined,
            credentials: 'include',
        })

        const data = await response.json().catch(() => null)

        return {
            ok: response.ok,
            status: response.status,
            data,
            headers: response.headers,
        }
    } catch (error) {
        if (!expectError) {
            log(`❌ Erro de rede: ${error.message}`, 'red')
        }
        return {
            ok: false,
            status: 0,
            error: error.message,
        }
    }
}

// Função de login para obter cookies de sessão
async function login() {
    log('\n🔐 Fazendo login...', 'cyan')
    log(`📧 Email: ${TEST_EMAIL}`, 'cyan')

    // Primeiro, obter CSRF token
    log('🔑 Obtendo CSRF token...', 'cyan')
    const csrfResponse = await request('GET', '/api/auth/csrf')

    if (!csrfResponse.ok) {
        log(`❌ Falha ao obter CSRF token - Status: ${csrfResponse.status}`, 'red')
        if (csrfResponse.error) {
            log(`⚠️  Erro de rede: ${csrfResponse.error}`, 'red')
        }
        if (csrfResponse.data) {
            log(`📊 Resposta: ${JSON.stringify(csrfResponse.data)}`, 'yellow')
        }
        return null
    }

    const csrfToken = csrfResponse.data?.csrfToken || csrfResponse.data?.token
    if (!csrfToken) {
        log('❌ CSRF token não encontrado na resposta', 'red')
        log(`📊 Resposta recebida: ${JSON.stringify(csrfResponse.data)}`, 'yellow')
        return null
    }

    log(`✅ CSRF token obtido: ${csrfToken.substring(0, 10)}...`, 'green')

    // Fazer login
    log('🔐 Autenticando...', 'cyan')
    const loginResponse = await request('POST', '/api/auth/login', {
        body: {
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        },
        headers: {
            'x-csrf-token': csrfToken,
        },
    })

    if (!loginResponse.ok) {
        log(`❌ Falha no login - Status: ${loginResponse.status}`, 'red')
        log(`⚠️  Mensagem: ${loginResponse.data?.error || 'Erro desconhecido'}`, 'red')
        if (loginResponse.data) {
            log(`📊 Resposta completa: ${JSON.stringify(loginResponse.data, null, 2)}`, 'yellow')
        }
        if (loginResponse.error) {
            log(`⚠️  Erro de rede: ${loginResponse.error}`, 'red')
        }
        return null
    }

    log('✅ Login bem-sucedido', 'green')

    if (!loginResponse.data?.token) {
        log('⚠️  Token não encontrado na resposta de login', 'yellow')
    }

    if (!loginResponse.data?.user) {
        log('⚠️  Dados do usuário não encontrados na resposta', 'yellow')
    }

    return {
        token: loginResponse.data.token,
        user: loginResponse.data.user,
    }
}

// Testes de API
const tests = [
    {
        name: 'GET /api/operador/employees',
        method: 'GET',
        endpoint: '/api/operador/employees',
        description: 'Listar funcionários',
        expectedStatus: 200,
    },
    {
        name: 'GET /api/operador/historico-rotas',
        method: 'GET',
        endpoint: '/api/operador/historico-rotas',
        description: 'Obter histórico de rotas',
        expectedStatus: 200,
    },
    {
        name: 'POST /api/operador/create-employee',
        method: 'POST',
        endpoint: '/api/operador/create-employee',
        description: 'Criar funcionário',
        body: {
            name: 'Funcionário Teste',
            email: `func.teste.${Date.now()}@test.com`,
            cpf: '12345678901',
            phone: '11999999999',
            role: 'driver',
        },
        expectedStatus: [200, 201],
        skipIfDataRequired: true,
    },
    {
        name: 'POST /api/operador/optimize-route',
        method: 'POST',
        endpoint: '/api/operador/optimize-route',
        description: 'Otimizar rota',
        body: {
            routeId: 'test-route-id',
            stops: [
                { lat: -23.55052, lng: -46.633308, address: 'São Paulo, SP' },
                { lat: -23.561684, lng: -46.656139, address: 'Av Paulista, SP' },
            ],
        },
        expectedStatus: [200, 404, 400],
        skipIfDataRequired: true,
    },
    {
        name: 'POST /api/operador/associate-company',
        method: 'POST',
        endpoint: '/api/operador/associate-company',
        description: 'Associar empresa',
        body: {
            userId: 'test-user-id',
            companyId: 'test-company-id',
        },
        expectedStatus: [200, 400, 403],
        skipIfDataRequired: true,
    },
]

async function runTests() {
    log('='.repeat(80), 'blue')
    log('🧪 TESTE DE APIs DO OPERADOR', 'blue')
    log('='.repeat(80), 'blue')

    // Login primeiro
    const auth = await login()
    if (!auth) {
        log('\n❌ Não foi possível fazer login. Verifique as credenciais.', 'red')
        process.exit(1)
    }

    log(`\n👤 Usuário: ${auth.user.email} (${auth.user.role})`, 'cyan')
    log(`🏢 Empresa: ${auth.user.companyId || 'N/A'}`, 'cyan')

    // Executar testes
    const results = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
    }

    for (const test of tests) {
        results.total++

        log(`\n${'─'.repeat(80)}`, 'blue')
        log(`📋 Teste: ${test.name}`, 'cyan')
        log(`📝 Descrição: ${test.description}`, 'cyan')

        if (test.skipIfDataRequired) {
            log('⚠️  Este teste pode falhar se não houver dados necessários', 'yellow')
        }

        const response = await request(test.method, test.endpoint, {
            body: test.body,
            headers: {
                Authorization: `Bearer ${auth.token}`,
            },
        })

        const expectedStatus = Array.isArray(test.expectedStatus)
            ? test.expectedStatus
            : [test.expectedStatus]

        const statusMatch = expectedStatus.includes(response.status)

        if (statusMatch) {
            log(`✅ PASSOU - Status: ${response.status}`, 'green')
            results.passed++

            if (response.data) {
                log(`📊 Resposta: ${JSON.stringify(response.data).substring(0, 200)}...`, 'cyan')
            }
        } else {
            log(`❌ FALHOU - Status esperado: ${expectedStatus.join(' ou ')}, recebido: ${response.status}`, 'red')
            results.failed++

            if (response.data) {
                log(`📊 Resposta: ${JSON.stringify(response.data, null, 2)}`, 'yellow')
            }
            if (response.error) {
                log(`⚠️  Erro: ${response.error}`, 'red')
            }
        }
    }

    // Resumo
    log('\n' + '='.repeat(80), 'blue')
    log('📊 RESUMO DOS TESTES', 'blue')
    log('='.repeat(80), 'blue')
    log(`Total de testes: ${results.total}`)
    log(`✅ Passou: ${results.passed}`, 'green')
    log(`❌ Falhou: ${results.failed}`, 'red')
    log(`⏭️  Pulado: ${results.skipped}`, 'yellow')
    log(`Taxa de sucesso: ${((results.passed / results.total) * 100).toFixed(1)}%`,
        results.passed === results.total ? 'green' : 'yellow')
    log('='.repeat(80), 'blue')

    // Exit code baseado no resultado
    process.exit(results.failed > 0 ? 1 : 0)
}

// Executar testes
runTests().catch((error) => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
})
