#!/usr/bin/env node

/**
 * Script de teste completo de login na Vercel
 */

const https = require('https')

const BASE_URL = 'https://golffox.vercel.app'
const TEST_EMAIL = 'golffox@admin.com'
const TEST_PASSWORD = 'senha123'

console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ 🧪 TESTE COMPLETO DE LOGIN - VERCEL                               ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

console.log(`📍 URL: ${BASE_URL}`)
console.log(`📧 Email: ${TEST_EMAIL}`)
console.log(`🔑 Senha: ${'*'.repeat(TEST_PASSWORD.length)}`)
console.log('')

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || []
        })
      })
    })
    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }
    req.end()
  })
}

async function main() {
  try {
    // PASSO 1: Verificar saúde do servidor
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('PASSO 1: Verificar Saúde do Servidor')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const healthRes = await makeRequest(`${BASE_URL}/api/health`)
    console.log(`Status: ${healthRes.statusCode}`)
    
    if (healthRes.statusCode === 200) {
      const health = JSON.parse(healthRes.body)
      console.log('✅ Servidor online')
      console.log(`   Supabase: ${health.supabase}`)
      console.log('')
    } else {
      console.log('❌ Servidor offline')
      return
    }

    // PASSO 2: Obter CSRF Token
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('PASSO 2: Obter CSRF Token')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const csrfRes = await makeRequest(`${BASE_URL}/api/auth/csrf`)
    console.log(`Status: ${csrfRes.statusCode}`)
    
    if (csrfRes.statusCode !== 200) {
      console.log('❌ Falha ao obter CSRF token')
      return
    }
    
    const csrfData = JSON.parse(csrfRes.body)
    const csrfToken = csrfData.token
    console.log(`✅ CSRF Token: ${csrfToken.substring(0, 20)}...`)
    
    // Extrair cookie CSRF
    const csrfCookie = csrfRes.cookies.find(c => c.startsWith('golffox-csrf='))
    console.log(`✅ Cookie CSRF: ${csrfCookie ? 'Definido' : 'Não definido'}`)
    console.log('')

    // PASSO 3: Fazer Login
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('PASSO 3: Fazer Login')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const loginBody = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
    
    const loginRes = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginBody),
        'x-csrf-token': csrfToken,
        'Cookie': csrfCookie || ''
      },
      body: loginBody
    })
    
    console.log(`Status: ${loginRes.statusCode}`)
    console.log('')
    
    if (loginRes.statusCode === 200) {
      const loginData = JSON.parse(loginRes.body)
      console.log('✅ LOGIN BEM-SUCEDIDO!')
      console.log('')
      console.log('📦 Resposta:')
      console.log(JSON.stringify(loginData, null, 2))
      console.log('')
      
      // Verificar cookie de sessão
      const sessionCookie = loginRes.cookies.find(c => c.startsWith('golffox-session='))
      if (sessionCookie) {
        console.log('✅ Cookie de sessão criado:')
        console.log(`   ${sessionCookie.substring(0, 100)}...`)
      } else {
        console.log('⚠️  Cookie de sessão NÃO foi criado')
      }
      console.log('')
      
      // PASSO 4: Testar acesso ao /admin
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('PASSO 4: Testar Acesso ao /admin')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      
      if (sessionCookie) {
        const adminRes = await makeRequest(`${BASE_URL}/admin`, {
          headers: {
            'Cookie': sessionCookie
          }
        })
        
        console.log(`Status: ${adminRes.statusCode}`)
        
        if (adminRes.statusCode === 200) {
          console.log('✅ Acesso ao /admin permitido!')
          console.log('✅ Usuário PERMANECEU na área administrativa')
        } else if (adminRes.statusCode === 302 || adminRes.statusCode === 307) {
          const location = adminRes.headers.location
          console.log(`⚠️  Redirecionado para: ${location}`)
          if (location && location.includes('?next=')) {
            console.log('❌ PROBLEMA: Usuário foi redirecionado de volta para login')
          }
        } else {
          console.log(`❌ Erro ao acessar /admin: ${adminRes.statusCode}`)
        }
      }
      
    } else {
      console.log('❌ LOGIN FALHOU!')
      console.log('')
      console.log('📦 Resposta:')
      console.log(loginRes.body)
    }
    
    console.log('')
    console.log('╔════════════════════════════════════════════════════════════════════╗')
    console.log('║ ✅ TESTE CONCLUÍDO                                                ║')
    console.log('╚════════════════════════════════════════════════════════════════════╝\n')
    
  } catch (err) {
    console.error('❌ Erro:', err.message)
    console.error(err)
  }
}

main()
