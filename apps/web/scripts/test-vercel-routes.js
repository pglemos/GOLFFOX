/**
 * Script: Testar Rotas Vercel
 * Testa se as rotas principais estão acessíveis
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const DOMAIN = process.env.VERCEL_DOMAIN || 'golffox.vercel.app'
const BASE_URL = `https://${DOMAIN}`

const routes = [
  { path: '/', name: 'Home', expectedStatus: [200, 302] },
  { path: '/operator', name: 'Operator Dashboard', expectedStatus: [200, 302, 401] },
  { path: '/api/health', name: 'Health Check', expectedStatus: [200, 404] }
]

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    https.get(url, { timeout: 10000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const duration = Date.now() - startTime
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          duration,
          size: data.length
        })
      })
    }).on('error', (error) => {
      reject(error)
    }).on('timeout', () => {
      reject(new Error('Request timeout'))
    })
  })
}

async function testRoutes() {
  const results = {
    timestamp: new Date().toISOString(),
    domain: DOMAIN,
    routes_tested: {}
  }

  console.log(`Testando rotas em ${BASE_URL}\n`)

  for (const route of routes) {
    const url = `${BASE_URL}${route.path}`
    try {
      console.log(`${route.name} (${route.path})...`)
      const response = await makeRequest(url)
      
      const isExpected = route.expectedStatus.includes(response.status)
      results.routes_tested[route.path] = {
        name: route.name,
        status: response.status,
        statusText: response.statusText,
        accessible: isExpected,
        duration_ms: response.duration,
        size_bytes: response.size,
        expected_statuses: route.expectedStatus
      }

      if (isExpected) {
        console.log(`   ${response.status} ${response.statusText} (${response.duration}ms)`)
      } else {
        console.log(`   ${response.status} ${response.statusText} (esperado: ${route.expectedStatus.join(', ')})`)
      }
    } catch (error) {
      results.routes_tested[route.path] = {
        name: route.name,
        accessible: false,
        error: error.message
      }
      console.log(`   Erro: ${error.message}`)
    }
  }

  const outputPath = path.join(__dirname, '..', 'VERCEL_ROUTES_TEST.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`\nResultados salvos em: ${outputPath}`)
  
  return results
}

testRoutes()
  .then(() => {
    console.log('\nTeste concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nErro fatal:', error)
    process.exit(1)
  })

