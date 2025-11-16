#!/usr/bin/env node

/**
 * Simulação COMPLETA de usuário - Teste detalhado
 * Simula exatamente o que acontece no navegador
 */

const https = require('https')
const http = require('http')

const BASE_URL = 'https://golffox.vercel.app'
const TEST_EMAIL = 'golffox@admin.com'
const TEST_PASSWORD = 'senha123'

console.log('\n╔════════════════════════════════════════════════════════════════════╗')
console.log('║ 🎭 SIMULAÇÃO COMPLETA DE USUÁRIO - TESTE DETALHADO                ║')
console.log('╚════════════════════════════════════════════════════════════════════╝\n')

console.log(`🌐 URL: ${BASE_URL}`)
console.log(`👤 Usuário: ${TEST_EMAIL}`)
console.log('')

let cookieJar = []

function extractCookies(setCookieHeaders) {
  if (!setCookieHeaders) return []
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders]
  return headers.map(cookie => cookie.split(';')[0])
}

function getCookieHeader() {
  return cookieJar.join('; ')
}

async function makeRequest(url, options = {}, followRedirect = false) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const requestOptions = {
      ...options,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      }
    }

    const req = protocol.request(url, requestOptions, (res) => {
      // Atualizar cookie jar
      const newCookies = extractCookies(res.headers['set-cookie'])
      newCookies.forEach(cookie => {
        const cookieName = cookie.split('=')[0]
        // Remover cookie antigo com mesmo nome
        cookieJar = cookieJar.filter(c => !c.startsWith(cookieName + '='))
        // Adicionar novo cookie
        if (!cookie.includes('=;') && !cookie.includes('=null')) {
          cookieJar.push(cookie)
        }
      })

      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        const result = {
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data,
          cookies: res.headers['set-cookie'] || [],
          location: res.headers.location
        }

        // Seguir redirect se necessário
        if (followRedirect && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308)) {
          const redirectUrl = res.headers.location
          if (redirectUrl) {
            const fullUrl = redirectUrl.startsWith('http') ? redirectUrl : BASE_URL + redirectUrl
            console.log(`   ↪️  Seguindo redirect: ${redirectUrl}`)
            makeRequest(fullUrl, { headers: { Cookie: getCookieHeader() } }, followRedirect)
              .then(resolve)
              .catch(reject)
            return
          }
        }

        resolve(result)
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
  const errors = []
  const warnings = []
  let currentStep = 0

  try {
    // ═══════════════════════════════════════════════════════════════
    // PASSO 1: Acessar página inicial (simular usuário abrindo site)
    // ═══════════════════════════════════════════════════════════════
    currentStep = 1
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('PASSO 1: Usuário Acessa https://golffox.vercel.app')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const homeRes = await makeRequest(BASE_URL + '/', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    })
    
    console.log(`📊 Status: ${homeRes.statusCode} ${homeRes.statusMessage}`)
    
    if (homeRes.statusCode !== 200) {
      errors.push(`PASSO 1: Homepage não retornou 200 (retornou ${homeRes.statusCode})`)
    }
    
    // Verificar cookies iniciais
    console.log(`🍪 Cookies recebidos: ${homeRes.cookies.length}`)
    homeRes.cookies.forEach(c => {
      const name = c.split('=')[0]
      console.log(`   - ${name}`)
    })
    
    // Verificar se tem CSRF cookie inicial
    const hasInitialCSRF = cookieJar.some(c => c.startsWith('golffox-csrf='))
    if (!hasInitialCSRF) {
      warnings.push('PASSO 1: Cookie CSRF não foi setado automaticamente na página inicial')
    }
    
    console.log(`\n📦 Cookie Jar atual: ${cookieJar.length} cookies`)
    cookieJar.forEach(c => console.log(`   ${c.substring(0, 60)}...`))
    console.log('')

    // ═══════════════════════════════════════════════════════════════
    // PASSO 2: Obter CSRF Token (simular fetch do frontend)
    // ═══════════════════════════════════════════════════════════════
    currentStep = 2
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('PASSO 2: Frontend Busca CSRF Token via /api/auth/csrf')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    const csrfRes = await makeRequest(BASE_URL + '/api/auth/csrf', {
      headers: {
        'Accept': 'application/json',
        'Cookie': getCookieHeader()
      }
    })
    
    console.log(`📊 Status: ${csrfRes.statusCode} ${csrfRes.statusMessage}`)
    
    if (csrfRes.statusCode !== 200) {
      errors.push(`PASSO 2: CSRF endpoint não retornou 200 (retornou ${csrfRes.statusCode})`)
      console.log(`❌ Erro: ${csrfRes.body}`)
      return
    }
    
    const csrfData = JSON.parse(csrfRes.body)
    const csrfToken = csrfData.token
    
    console.log(`✅ CSRF Token recebido: ${csrfToken.substring(0, 30)}...`)
    console.log(`🍪 Cookies atualizados: ${csrfRes.cookies.length}`)
    csrfRes.cookies.forEach(c => {
      const name = c.split('=')[0]
      console.log(`   - ${name}`)
    })
    
    console.log(`\n📦 Cookie Jar após CSRF: ${cookieJar.length} cookies`)
    cookieJar.forEach(c => console.log(`   ${c.substring(0, 60)}...`))
    
    const hasCSRFCookie = cookieJar.some(c => c.startsWith('golffox-csrf='))
    if (!hasCSRFCookie) {
      errors.push('PASSO 2: Cookie golffox-csrf não foi setado')
    } else {
      console.log(`✅ Cookie CSRF presente`)
    }
    console.log('')

    // ═══════════════════════════════════════════════════════════════
    // PASSO 3: Fazer Login (simular submit do form)
    // ═══════════════════════════════════════════════════════════════
    currentStep = 3
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('PASSO 3: Usuário Preenche Form e Clica em "Entrar"')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log(`📝 Email: ${TEST_EMAIL}`)
    console.log(`🔑 Senha: ${'*'.repeat(TEST_PASSWORD.length)}`)
    console.log(`🛡️  CSRF Token: ${csrfToken.substring(0, 30)}...`)
    console.log('')
    
    const loginBody = JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
    
    const loginRes = await makeRequest(BASE_URL + '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginBody),
        'Accept': 'application/json',
        'x-csrf-token': csrfToken,
        'Cookie': getCookieHeader(),
        'Origin': BASE_URL,
        'Referer': BASE_URL + '/'
      },
      body: loginBody
    })
    
    console.log(`📊 Status: ${loginRes.statusCode} ${loginRes.statusMessage}`)
    
    if (loginRes.statusCode !== 200) {
      errors.push(`PASSO 3: Login não retornou 200 (retornou ${loginRes.statusCode})`)
      console.log(`❌ Erro: ${loginRes.body}`)
      
      // Tentar parsear o erro
      try {
        const errorData = JSON.parse(loginRes.body)
        console.log(`📦 Detalhes do erro:`, errorData)
      } catch (e) {
        console.log(`📦 Resposta (não é JSON): ${loginRes.body.substring(0, 200)}`)
      }
      return
    }
    
    console.log(`✅ Login bem-sucedido!`)
    
    const loginData = JSON.parse(loginRes.body)
    console.log(`\n📦 Resposta do login:`)
    console.log(`   User ID: ${loginData.user?.id}`)
    console.log(`   Email: ${loginData.user?.email}`)
    console.log(`   Role: ${loginData.user?.role}`)
    console.log(`   Token: ${loginData.token ? loginData.token.substring(0, 50) + '...' : 'N/A'}`)
    
    console.log(`\n🍪 Cookies após login: ${loginRes.cookies.length}`)
    loginRes.cookies.forEach(c => {
      const name = c.split('=')[0]
      const value = c.split('=')[1]?.split(';')[0]
      console.log(`   - ${name}: ${value ? value.substring(0, 40) + '...' : 'empty'}`)
    })
    
    console.log(`\n📦 Cookie Jar após login: ${cookieJar.length} cookies`)
    cookieJar.forEach(c => {
      const name = c.split('=')[0]
      const value = c.split('=')[1]
      console.log(`   ${name}: ${value ? value.substring(0, 40) + '...' : 'empty'}`)
    })
    
    const hasSessionCookie = cookieJar.some(c => c.startsWith('golffox-session=') && !c.includes('=;'))
    if (!hasSessionCookie) {
      errors.push('PASSO 3: Cookie golffox-session não foi setado ou está vazio')
    } else {
      console.log(`\n✅ Cookie de sessão presente e válido`)
    }
    console.log('')

    // ═══════════════════════════════════════════════════════════════
    // PASSO 4: Frontend redireciona para /admin
    // ═══════════════════════════════════════════════════════════════
    currentStep = 4
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('PASSO 4: Frontend Redireciona para /admin')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log(`🍪 Enviando cookies: ${cookieJar.length}`)
    cookieJar.forEach(c => {
      const name = c.split('=')[0]
      console.log(`   ${name}`)
    })
    console.log('')
    
    const adminRes = await makeRequest(BASE_URL + '/admin', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cookie': getCookieHeader(),
        'Referer': BASE_URL + '/'
      }
    }, false) // NÃO seguir redirects automaticamente
    
    console.log(`📊 Status: ${adminRes.statusCode} ${adminRes.statusMessage}`)
    
    if (adminRes.statusCode === 200) {
      console.log(`✅ Acesso ao /admin PERMITIDO!`)
      console.log(`✅ Usuário PERMANECEU na área administrativa`)
      
      // Verificar se é HTML válido
      if (adminRes.body.includes('<!DOCTYPE html>') || adminRes.body.includes('<html')) {
        console.log(`✅ Página HTML carregada corretamente`)
      } else {
        warnings.push('PASSO 4: Resposta não parece ser HTML válido')
      }
      
    } else if (adminRes.statusCode === 302 || adminRes.statusCode === 307 || adminRes.statusCode === 301) {
      const redirectLocation = adminRes.headers.location
      console.log(`⚠️  REDIRECIONAMENTO DETECTADO!`)
      console.log(`📍 Location: ${redirectLocation}`)
      
      errors.push(`PASSO 4: Middleware redirecionou de /admin para ${redirectLocation}`)
      
      if (redirectLocation?.includes('?next=')) {
        errors.push('CRÍTICO: Usuário sendo redirecionado de volta para login após login bem-sucedido!')
        console.log(`\n❌ PROBLEMA CRÍTICO IDENTIFICADO:`)
        console.log(`   O middleware está invalidando a sessão e redirecionando de volta`)
        console.log(`   Isso significa que o cookie não está sendo validado corretamente`)
      }
      
      // Seguir o redirect para ver onde termina
      console.log(`\n🔍 Seguindo redirect para ver onde termina...`)
      const finalRes = await makeRequest(
        redirectLocation.startsWith('http') ? redirectLocation : BASE_URL + redirectLocation,
        {
          headers: {
            'Accept': 'text/html',
            'Cookie': getCookieHeader()
          }
        },
        false
      )
      console.log(`📍 Destino final: Status ${finalRes.statusCode}`)
      if (finalRes.statusCode === 200) {
        console.log(`   URL final não pode ser determinada, mas retornou 200`)
      }
      
    } else {
      errors.push(`PASSO 4: Status inesperado ao acessar /admin: ${adminRes.statusCode}`)
      console.log(`❌ Resposta: ${adminRes.body.substring(0, 200)}`)
    }
    
    console.log('')

    // ═══════════════════════════════════════════════════════════════
    // ANÁLISE FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 ANÁLISE FINAL')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    
    console.log(`✅ Passos completados: ${currentStep}/4`)
    console.log(`⚠️  Avisos: ${warnings.length}`)
    console.log(`❌ Erros: ${errors.length}`)
    console.log('')
    
    if (warnings.length > 0) {
      console.log('⚠️  AVISOS:')
      warnings.forEach((w, i) => console.log(`   ${i + 1}. ${w}`))
      console.log('')
    }
    
    if (errors.length > 0) {
      console.log('❌ ERROS ENCONTRADOS:')
      errors.forEach((e, i) => console.log(`   ${i + 1}. ${e}`))
      console.log('')
      
      console.log('╔════════════════════════════════════════════════════════════════════╗')
      console.log('║ ❌ TESTE FALHOU - PROBLEMAS IDENTIFICADOS                         ║')
      console.log('╚════════════════════════════════════════════════════════════════════╝\n')
    } else {
      console.log('╔════════════════════════════════════════════════════════════════════╗')
      console.log('║ ✅ TESTE PASSOU - SISTEMA FUNCIONANDO CORRETAMENTE                ║')
      console.log('╚════════════════════════════════════════════════════════════════════╝\n')
    }
    
  } catch (err) {
    console.error(`\n❌ ERRO NO PASSO ${currentStep}:`, err.message)
    console.error(err)
    errors.push(`PASSO ${currentStep}: Exceção - ${err.message}`)
  }
  
  process.exit(errors.length > 0 ? 1 : 0)
}

main()

