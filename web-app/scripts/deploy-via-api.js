/**
 * Deploy no Vercel via API usando a URL de integração fornecida
 */

const https = require('https')
const { execSync } = require('child_process')

const DEPLOY_URL = 'https://api.vercel.com/v1/integrations/deploy/prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m/1wJyfAoShc'

function getVercelToken() {
  try {
    // Tentar obter do arquivo de configuração
    const os = require('os')
    const path = require('path')
    const fs = require('fs')
    
    const configPath = path.join(os.homedir(), '.vercel', 'auth.json')
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      if (config.token) {
        return config.token
      }
    }
    
    // Tentar via CLI
    try {
      const result = execSync('vercel whoami --token', { encoding: 'utf-8', stdio: 'pipe' })
      return result.trim()
    } catch (e) {
      return process.env.VERCEL_TOKEN
    }
  } catch (error) {
    return process.env.VERCEL_TOKEN
  }
}

function triggerDeploy() {
  return new Promise((resolve, reject) => {
    const token = getVercelToken()
    if (!token) {
      reject(new Error('Token do Vercel não encontrado'))
      return
    }

    const url = new URL(DEPLOY_URL)
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }

    console.log('🚀 Disparando deploy via API do Vercel...')
    console.log(`   URL: ${DEPLOY_URL}`)

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('✅ Deploy disparado com sucesso!')
            console.log('📊 Resposta:', JSON.stringify(parsed, null, 2))
            resolve(parsed)
          } else {
            console.error('❌ Erro na API:', res.statusCode)
            console.error('Resposta:', body)
            reject(new Error(`API Error ${res.statusCode}: ${body}`))
          }
        } catch (e) {
          console.log('✅ Deploy pode ter sido disparado (resposta não-JSON)')
          console.log('Resposta:', body)
          resolve({ raw: body })
        }
      })
    })

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message)
      reject(error)
    })

    req.end()
  })
}

// Executar
if (require.main === module) {
  triggerDeploy()
    .then(() => {
      console.log('\n✅ Deploy iniciado!')
      console.log('🌐 Verifique o status em: https://vercel.com/dashboard')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Erro:', error.message)
      console.error('\n💡 Alternativa: Execute manualmente:')
      console.error('   vercel --prod --yes')
      process.exit(1)
    })
}

module.exports = { triggerDeploy }

