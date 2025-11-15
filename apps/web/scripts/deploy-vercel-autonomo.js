/**
 * Script autônomo para deploy no Vercel via API
 * Configura variáveis de ambiente e executa deploy
 */

const https = require('https')
const { execSync } = require('child_process')
const crypto = require('crypto')

const PROJECT_ID = 'prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m'
const TEAM_ID = 'team_9kUTSaoIkwnAVxy9nXMcAnej'

// Variáveis de ambiente necessárias
const ENV_VARS = {
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': 'https://vmoxzesvjcfmrebagcwo.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A',
  
  // Google Maps
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': 'AIzaSyD79t05YxpU2RnEczY-NSDxhdbY9OvigsM',
  
  // CRON Secret (gerar novo)
  'CRON_SECRET': crypto.randomBytes(32).toString('hex'),
  
  // Opcionais
  'NODE_ENV': 'production',
}

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Obter token do Vercel CLI
function getVercelToken() {
  try {
    // Tentar obter do arquivo de configuração do Vercel
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
    
    // Tentar obter via CLI
    try {
      const result = execSync('vercel whoami --token', { encoding: 'utf-8', stdio: 'pipe' })
      return result.trim()
    } catch (e) {
      // Se não conseguir, tentar usar variável de ambiente
      return process.env.VERCEL_TOKEN
    }
  } catch (error) {
    log('⚠️  Não foi possível obter token automaticamente', 'yellow')
    return process.env.VERCEL_TOKEN
  }
}

// Fazer requisição HTTP para API do Vercel
function vercelApiRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const token = getVercelToken()
    if (!token) {
      reject(new Error('Token do Vercel não encontrado. Configure VERCEL_TOKEN ou faça login com vercel login'))
      return
    }

    const options = {
      hostname: 'api.vercel.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    }

    const req = https.request(options, (res) => {
      let body = ''
      res.on('data', (chunk) => { body += chunk })
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {}
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed)
          } else {
            reject(new Error(`API Error ${res.statusCode}: ${JSON.stringify(parsed)}`))
          }
        } catch (e) {
          resolve({ raw: body })
        }
      })
    })

    req.on('error', reject)

    if (data) {
      req.write(JSON.stringify(data))
    }
    req.end()
  })
}

// Adicionar variável de ambiente
async function addEnvVar(key, value, environments = ['production', 'preview', 'development']) {
  try {
    log(`➕ Configurando ${key}...`, 'cyan')
    
    for (const env of environments) {
      await vercelApiRequest('POST', `/v10/projects/${PROJECT_ID}/env`, {
        key,
        value,
        type: key.startsWith('NEXT_PUBLIC_') ? 'plain' : 'encrypted',
        target: [env]
      })
    }
    
    log(`   ✅ ${key} configurado para ${environments.join(', ')}`, 'green')
    return true
  } catch (error) {
    // Se já existe, tentar atualizar
    if (error.message.includes('already exists') || error.message.includes('409')) {
      log(`   ⚠️  ${key} já existe, tentando atualizar...`, 'yellow')
      try {
        // Listar env vars existentes
        const envs = await vercelApiRequest('GET', `/v10/projects/${PROJECT_ID}/env`)
        const existing = envs.envs?.find(e => e.key === key)
        
        if (existing) {
          // Deletar e recriar
          await vercelApiRequest('DELETE', `/v10/projects/${PROJECT_ID}/env/${existing.id}`)
          await addEnvVar(key, value, environments)
        }
      } catch (e) {
        log(`   ❌ Erro ao atualizar ${key}: ${e.message}`, 'red')
        return false
      }
    } else {
      log(`   ❌ Erro ao configurar ${key}: ${error.message}`, 'red')
      return false
    }
  }
}

// Fazer deploy via CLI (mais confiável)
async function deployViaCLI() {
  try {
    log('\n🚀 Iniciando deploy via Vercel CLI...', 'magenta')
    
    // Verificar se está no diretório correto
    const path = require('path')
    const fs = require('fs')
    const projectRoot = path.resolve(__dirname, '..')
    
    // Mudar para diretório raiz do projeto (não web-app)
    const repoRoot = path.resolve(projectRoot, '..')
    
    log(`📁 Diretório do projeto: ${repoRoot}`, 'blue')
    
    // Executar deploy
    execSync('vercel --prod --yes', {
      cwd: repoRoot,
      stdio: 'inherit'
    })
    
    log('\n✅ Deploy concluído com sucesso!', 'green')
    return true
  } catch (error) {
    log(`\n❌ Erro no deploy: ${error.message}`, 'red')
    return false
  }
}

// Função principal
async function main() {
  log('\n' + '='.repeat(60), 'magenta')
  log('🚀 Deploy Autônomo no Vercel', 'magenta')
  log('='.repeat(60) + '\n', 'magenta')

  // Verificar autenticação
  log('1️⃣ Verificando autenticação...', 'blue')
  try {
    const user = execSync('vercel whoami', { encoding: 'utf-8' }).trim()
    log(`✅ Autenticado como: ${user}`, 'green')
  } catch (error) {
    log('❌ Não autenticado. Execute: vercel login', 'red')
    process.exit(1)
  }

  // Verificar se está no team correto
  log('\n2️⃣ Verificando team...', 'blue')
  try {
    execSync(`vercel switch --scope ${TEAM_ID}`, { stdio: 'ignore' })
    log(`✅ Team configurado: ${TEAM_ID}`, 'green')
  } catch (error) {
    log('⚠️  Não foi possível configurar team automaticamente', 'yellow')
  }

  // Configurar variáveis de ambiente
  log('\n3️⃣ Configurando variáveis de ambiente...', 'blue')
  log(`🔑 CRON_SECRET gerado: ${ENV_VARS.CRON_SECRET}`, 'magenta')
  
  let successCount = 0
  for (const [key, value] of Object.entries(ENV_VARS)) {
    const success = await addEnvVar(key, value)
    if (success) successCount++
  }

  log(`\n📊 Variáveis configuradas: ${successCount}/${Object.keys(ENV_VARS).length}`, 
    successCount === Object.keys(ENV_VARS).length ? 'green' : 'yellow')

  // Fazer deploy
  log('\n4️⃣ Executando deploy...', 'blue')
  const deploySuccess = await deployViaCLI()

  // Resumo
  log('\n' + '='.repeat(60), 'magenta')
  log('📊 Resumo do Deploy', 'magenta')
  log('='.repeat(60), 'magenta')
  log(`✅ Variáveis configuradas: ${successCount}/${Object.keys(ENV_VARS).length}`, 
    successCount === Object.keys(ENV_VARS).length ? 'green' : 'yellow')
  log(`${deploySuccess ? '✅' : '❌'} Deploy: ${deploySuccess ? 'Concluído' : 'Falhou'}`, 
    deploySuccess ? 'green' : 'red')
  log('='.repeat(60) + '\n', 'magenta')

  if (deploySuccess) {
    log('🎉 Deploy concluído com sucesso!', 'green')
    log('🌐 Verifique o status em: https://vercel.com/dashboard', 'blue')
  } else {
    log('❌ Deploy falhou. Verifique os logs acima.', 'red')
    process.exit(1)
  }
}

// Executar
if (require.main === module) {
  main().catch((error) => {
    log(`\n❌ Erro fatal: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })
}

module.exports = { main, addEnvVar, deployViaCLI }

