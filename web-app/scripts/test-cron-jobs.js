/**
 * Script: Testar Cron Jobs
 * Testa endpoints de cron jobs via HTTP com CRON_SECRET
 */

const https = require('https')
const fs = require('fs')
const path = require('path')

const DOMAIN = process.env.VERCEL_DOMAIN || 'golffox.vercel.app'
const BASE_URL = `https://${DOMAIN}`
const CRON_SECRET = process.env.CRON_SECRET

const CRON_ENDPOINTS = [
  { path: '/api/cron/refresh-kpis', name: 'Refresh KPIs', method: 'GET' },
  { path: '/api/cron/dispatch-reports', name: 'Dispatch Reports', method: 'GET' }
]

function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    const urlObj = new URL(url)
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'User-Agent': 'Vercel-Cron-Test/1.0',
        ...headers
      },
      timeout: 30000
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const duration = Date.now() - startTime
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          headers: res.headers,
          body: data,
          duration,
          size: data.length
        })
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

async function testCronJobs() {
  const results = {
    timestamp: new Date().toISOString(),
    domain: DOMAIN,
    cron_secret_configured: !!CRON_SECRET,
    endpoints_tested: {},
    errors: []
  }

  if (!CRON_SECRET) {
    results.errors.push('CRON_SECRET não configurado. Configure via ENV ou .env')
    console.log('❌ CRON_SECRET não configurado!')
    console.log('   Configure via: export CRON_SECRET=seu_secret')
    console.log('   Ou adicione no arquivo .env\n')
  }

  console.log(`🧪 Testando cron jobs em ${BASE_URL}\n`)
  console.log(`🔑 CRON_SECRET: ${CRON_SECRET ? '✅ Configurado' : '❌ Não configurado'}\n`)

  for (const endpoint of CRON_ENDPOINTS) {
    const url = `${BASE_URL}${endpoint.path}`
    const authHeader = CRON_SECRET ? `Bearer ${CRON_SECRET}` : null

    console.log(`📍 ${endpoint.name} (${endpoint.path})...`)

    try {
      const response = await makeRequest(url, endpoint.method, {
        'Authorization': authHeader || ''
      })

      const isSuccess = response.status === 200 || response.status === 201
      results.endpoints_tested[endpoint.path] = {
        name: endpoint.name,
        method: endpoint.method,
        status: response.status,
        statusText: response.statusText,
        success: isSuccess,
        duration_ms: response.duration,
        size_bytes: response.size,
        body: response.body.substring(0, 500) // Limitar tamanho do body no relatório
      }

      if (isSuccess) {
        console.log(`   ✅ ${response.status} ${response.statusText} (${response.duration}ms)`)
        try {
          const body = JSON.parse(response.body)
          if (body.success) {
            console.log(`   ✅ Operação bem-sucedida`)
          }
          if (body.refreshed_at) {
            console.log(`   📅 Atualizado em: ${body.refreshed_at}`)
          }
          if (body.processed !== undefined) {
            console.log(`   📊 Processados: ${body.processed}`)
          }
        } catch (e) {
          // Ignorar erro de parse
        }
      } else {
        console.log(`   ⚠️  ${response.status} ${response.statusText}`)
        if (response.status === 401) {
          console.log(`   ⚠️  Não autorizado - verifique CRON_SECRET`)
        }
      }
    } catch (error) {
      results.endpoints_tested[endpoint.path] = {
        name: endpoint.name,
        method: endpoint.method,
        success: false,
        error: error.message
      }
      console.log(`   ❌ Erro: ${error.message}`)
      results.errors.push(`${endpoint.path}: ${error.message}`)
    }

    console.log('')
  }

  // Salvar relatório
  const outputPath = path.join(__dirname, '..', 'CRON_JOBS_TEST.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`📄 Relatório salvo em: ${outputPath}`)

  return results
}

testCronJobs()
  .then(() => {
    console.log('\n✅ Teste de cron jobs concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

