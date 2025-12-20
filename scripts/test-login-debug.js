/**
 * Script de Debug para Teste de Login
 * 
 * Testa o fluxo completo de login para identificar problemas
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://golffox.vercel.app'
const TEST_EMAIL = 'golffox@admin.com'
const TEST_PASSWORD = 'senha123'

async function testLogin() {
  console.log('🔍 Iniciando teste de login...\n')
  console.log(`URL: ${BASE_URL}`)
  console.log(`Email: ${TEST_EMAIL}\n`)

  try {
    // 1. Obter CSRF token
    console.log('1️⃣ Obtendo CSRF token...')
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })

    console.log(`   Status: ${csrfResponse.status}`)
    console.log(`   Headers:`, Object.fromEntries(csrfResponse.headers.entries()))

    if (!csrfResponse.ok) {
      const errorText = await csrfResponse.text()
      console.error(`   ❌ Erro ao obter CSRF token: ${errorText}`)
      return
    }

    const csrfData = await csrfResponse.json()
    // A API retorna { success: true, data: { token, csrfToken } }
    const csrfToken = csrfData?.data?.token || csrfData?.data?.csrfToken || csrfData?.token || csrfData?.csrfToken
    const csrfCookie = csrfResponse.headers.get('set-cookie')

    console.log(`   ✅ CSRF token obtido: ${csrfToken ? csrfToken.substring(0, 20) + '...' : 'NÃO ENCONTRADO'}`)
    console.log(`   Cookie CSRF: ${csrfCookie ? 'Definido' : 'Não definido'}`)

    if (!csrfToken) {
      console.error('   ❌ CSRF token não encontrado na resposta')
      console.log('   Resposta completa:', JSON.stringify(csrfData, null, 2))
      return
    }

    // 2. Fazer login
    console.log('\n2️⃣ Fazendo login...')
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    })

    console.log(`   Status: ${loginResponse.status}`)
    console.log(`   Status Text: ${loginResponse.statusText}`)
    console.log(`   Headers:`, Object.fromEntries(loginResponse.headers.entries()))

    const loginData = await loginResponse.json().catch(async () => {
      const text = await loginResponse.text()
      return { error: 'Failed to parse JSON', raw: text }
    })

    if (!loginResponse.ok) {
      console.error(`   ❌ Erro no login:`)
      console.error(`   Código: ${loginData?.code || 'N/A'}`)
      console.error(`   Mensagem: ${loginData?.error || loginData?.message || 'Erro desconhecido'}`)
      console.error(`   Resposta completa:`, JSON.stringify(loginData, null, 2))
      return
    }

    console.log(`   ✅ Login bem-sucedido!`)
    console.log(`   Token: ${loginData?.token ? 'Presente' : 'Ausente'}`)
    console.log(`   User ID: ${loginData?.user?.id || 'N/A'}`)
    console.log(`   User Email: ${loginData?.user?.email || 'N/A'}`)
    console.log(`   User Role: ${loginData?.user?.role || 'N/A'}`)
    console.log(`   Session Cookie: ${loginResponse.headers.get('set-cookie') ? 'Definido' : 'Não definido'}`)

    // 3. Verificar sessão
    console.log('\n3️⃣ Verificando sessão...')
    const sessionCookie = loginResponse.headers.get('set-cookie')
    if (sessionCookie) {
      console.log(`   ✅ Cookie de sessão definido`)
      console.log(`   Cookie: ${sessionCookie.substring(0, 100)}...`)
    } else {
      console.log(`   ⚠️ Cookie de sessão não definido`)
    }

    // 4. Testar /api/auth/me
    console.log('\n4️⃣ Testando /api/auth/me...')
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })

    console.log(`   Status: ${meResponse.status}`)
    if (meResponse.ok) {
      const meData = await meResponse.json()
      console.log(`   ✅ Sessão válida`)
      console.log(`   User: ${meData?.user?.email || 'N/A'}`)
      console.log(`   Role: ${meData?.user?.role || 'N/A'}`)
    } else {
      const meError = await meResponse.json().catch(() => ({}))
      console.log(`   ❌ Erro ao verificar sessão: ${meError?.error || meResponse.statusText}`)
    }

    console.log('\n✅ Teste concluído!')

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error)
    console.error('Stack:', error.stack)
  }
}

// Executar teste
testLogin()

