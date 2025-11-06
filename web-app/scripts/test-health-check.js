/**
 * Script: Testar Health Check
 * Testa o endpoint /api/health
 */

const https = require('https')

const DOMAIN = process.env.VERCEL_DOMAIN || 'golffox.vercel.app'
const URL = `https://${DOMAIN}/api/health`

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    https.get(url, { timeout: 10000 }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const duration = Date.now() - startTime
        try {
          const json = JSON.parse(data)
          resolve({
            status: res.statusCode,
            body: json,
            duration
          })
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            duration
          })
        }
      })
    }).on('error', (error) => {
      reject(error)
    }).on('timeout', () => {
      reject(new Error('Request timeout'))
    })
  })
}

async function testHealthCheck() {
  console.log(`🏥 Testando health check: ${URL}\n`)

  try {
    const response = await makeRequest(URL)
    
    console.log(`Status: ${response.status}`)
    console.log(`Duração: ${response.duration}ms`)
    console.log(`Resposta:`)
    console.log(JSON.stringify(response.body, null, 2))
    
    if (response.status === 200 && response.body.ok === true) {
      console.log(`\n✅ Health check OK!`)
      return true
    } else {
      console.log(`\n⚠️  Health check retornou status inesperado`)
      return false
    }
  } catch (error) {
    console.error(`\n❌ Erro ao testar health check: ${error.message}`)
    return false
  }
}

testHealthCheck()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })

