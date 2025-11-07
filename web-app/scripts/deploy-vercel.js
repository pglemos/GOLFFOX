/**
 * Script para preparar e validar deploy no Vercel
 * Verifica variáveis de ambiente e configurações antes do deploy
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

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

// Variáveis obrigatórias
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'CRON_SECRET'
]

const OPTIONAL_ENV_VARS = [
  'RESEND_API_KEY',
  'REPORTS_FROM_EMAIL',
  'REPORTS_BCC',
  'NEXT_PUBLIC_BASE_URL'
]

async function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

async function checkVercelAuth() {
  try {
    const result = execSync('vercel whoami', { encoding: 'utf-8', stdio: 'pipe' })
    return result.trim()
  } catch {
    return null
  }
}

async function checkEnvVars() {
  log('\n🔍 Verificando variáveis de ambiente no Vercel...', 'blue')
  
  try {
    const result = execSync('vercel env ls', { encoding: 'utf-8', stdio: 'pipe' })
    const lines = result.split('\n')
    
    const foundVars = new Set()
    lines.forEach(line => {
      REQUIRED_ENV_VARS.forEach(varName => {
        if (line.includes(varName)) {
          foundVars.add(varName)
        }
      })
    })
    
    const missing = REQUIRED_ENV_VARS.filter(v => !foundVars.has(v))
    
    if (missing.length === 0) {
      log('✅ Todas as variáveis obrigatórias encontradas', 'green')
      return true
    } else {
      log(`❌ Variáveis faltando: ${missing.join(', ')}`, 'red')
      return false
    }
  } catch (error) {
    log('⚠️  Não foi possível verificar variáveis (pode ser normal se não autenticado)', 'yellow')
    return false
  }
}

async function validateBuild() {
  log('\n🔨 Validando build local...', 'blue')
  
  try {
    log('Executando type-check...', 'yellow')
    execSync('npm run type-check', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    log('✅ Type-check passou', 'green')
    
    log('\nExecutando lint...', 'yellow')
    execSync('npm run lint', { stdio: 'inherit', cwd: path.join(__dirname, '..') })
    log('✅ Lint passou', 'green')
    
    return true
  } catch (error) {
    log('❌ Build validation falhou', 'red')
    return false
  }
}

async function generateCronSecret() {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

async function deploy() {
  log('\n' + '='.repeat(60), 'magenta')
  log('🚀 Preparando Deploy no Vercel', 'magenta')
  log('='.repeat(60) + '\n', 'magenta')

  // Verificar Vercel CLI
  log('1️⃣ Verificando Vercel CLI...', 'blue')
  if (!(await checkVercelCLI())) {
    log('❌ Vercel CLI não instalado. Instale com: npm i -g vercel', 'red')
    process.exit(1)
  }
  log('✅ Vercel CLI instalado', 'green')

  // Verificar autenticação
  log('\n2️⃣ Verificando autenticação...', 'blue')
  const user = await checkVercelAuth()
  if (!user) {
    log('⚠️  Não autenticado. Execute: vercel login', 'yellow')
    log('   Depois execute este script novamente.', 'yellow')
    process.exit(1)
  }
  log(`✅ Autenticado como: ${user}`, 'green')

  // Verificar variáveis de ambiente
  log('\n3️⃣ Verificando variáveis de ambiente...', 'blue')
  const envOk = await checkEnvVars()
  if (!envOk) {
    log('\n📋 Variáveis obrigatórias que precisam ser configuradas:', 'yellow')
    REQUIRED_ENV_VARS.forEach(varName => {
      log(`   - ${varName}`, 'yellow')
    })
    log('\n💡 Para configurar:', 'blue')
    log('   1. Acesse: https://vercel.com/dashboard', 'blue')
    log('   2. Selecione projeto: golffox', 'blue')
    log('   3. Vá em Settings → Environment Variables', 'blue')
    log('   4. Adicione as variáveis faltantes', 'blue')
    log('\n   OU use o comando:', 'blue')
    log('   vercel env add <VAR_NAME> production preview development', 'blue')
    
    // Gerar CRON_SECRET se não existir
    if (!envOk) {
      const secret = await generateCronSecret()
      log(`\n🔑 CRON_SECRET sugerido: ${secret}`, 'magenta')
      log('   Adicione este valor no Vercel como CRON_SECRET', 'blue')
    }
  }

  // Validar build
  log('\n4️⃣ Validando build local...', 'blue')
  const buildOk = await validateBuild()
  if (!buildOk) {
    log('\n❌ Validação de build falhou. Corrija os erros antes de fazer deploy.', 'red')
    process.exit(1)
  }

  // Resumo
  log('\n' + '='.repeat(60), 'magenta')
  log('📊 Resumo da Preparação', 'magenta')
  log('='.repeat(60), 'magenta')
  log(`✅ Vercel CLI: OK`, 'green')
  log(`✅ Autenticação: ${user}`, 'green')
  log(`${envOk ? '✅' : '⚠️ '} Variáveis de Ambiente: ${envOk ? 'OK' : 'Verificar'}`, envOk ? 'green' : 'yellow')
  log(`✅ Build Validation: OK`, 'green')
  log('='.repeat(60) + '\n', 'magenta')

  if (!envOk) {
    log('⚠️  Configure as variáveis de ambiente antes de fazer deploy.', 'yellow')
    log('   Após configurar, execute este script novamente.\n', 'yellow')
    process.exit(0)
  }

  // Deploy
  log('🚀 Iniciando deploy...', 'magenta')
  log('   Execute: vercel --prod', 'blue')
  log('   OU: git push origin main (se configurado auto-deploy)\n', 'blue')
  
  // Perguntar se quer fazer deploy agora
  log('💡 Para fazer deploy agora, execute:', 'blue')
  log('   vercel --prod', 'green')
}

// Executar
if (require.main === module) {
  deploy().catch((error) => {
    log(`\n❌ Erro: ${error.message}`, 'red')
    process.exit(1)
  })
}

module.exports = { deploy }

