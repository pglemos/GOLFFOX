/**
 * Script: Verificar Variáveis de Ambiente Vercel
 * Compara variáveis requeridas vs existentes via CLI
 * Gera CRON_SECRET se ausente
 */

const { execSync } = require('child_process')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const PROJECT_ID = 'prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m'
const TEAM_ID = 'team_9kUTSaoIkwnAVxy9nXMcAnej'
const PROJECT_NAME = 'golffox'

const REQUIRED_ENVS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'CRON_SECRET',
  'RESEND_API_KEY' // Opcional se usar e-mail
]

function runVercelCommand(command) {
  try {
    const output = execSync(command, { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      timeout: 30000 
    })
    return { success: true, output: output.trim() }
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      output: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : ''
    }
  }
}

function generateCronSecret() {
  return crypto.randomBytes(32).toString('hex')
}

async function checkVercelEnv() {
  const results = {
    timestamp: new Date().toISOString(),
    project: {
      id: PROJECT_ID,
      name: PROJECT_NAME,
      team_id: TEAM_ID
    },
    environment_variables: {
      production: {},
      preview: {},
      development: {}
    },
    missing_vars: {
      production: [],
      preview: [],
      development: []
    },
    cron_secret_generated: null,
    errors: []
  }

  console.log('🔍 Verificando variáveis de ambiente no Vercel...\n')

  // Verificar autenticação
  console.log('1. Verificando autenticação Vercel CLI...')
  const whoami = runVercelCommand('vercel whoami')
  if (whoami.success) {
    console.log(`   ✅ Autenticado como: ${whoami.output}\n`)
  } else {
    console.log(`   ⚠️  Não autenticado. Execute 'vercel login' primeiro.\n`)
    results.errors.push('Not authenticated with Vercel CLI')
    console.log('   ℹ️  Continuando com verificação manual...\n')
  }

  // Listar variáveis de ambiente
  console.log('2. Listando variáveis de ambiente...')
  const envsResult = runVercelCommand(
    `vercel env ls ${PROJECT_NAME}`
  )
  
  // Se falhar, tentar sem scope
  if (!envsResult.success) {
    const envsResult2 = runVercelCommand(
      `vercel env ls`
    )
    if (envsResult2.success) {
      envsResult.success = true
      envsResult.output = envsResult2.output
    }
  }

  if (envsResult.success) {
    const lines = envsResult.output.split('\n').filter(line => line.trim())
    console.log(`   ✅ ${lines.length} variáveis encontradas\n`)

    // Verificar cada variável requerida
    for (const env of REQUIRED_ENVS) {
      const existsInProduction = lines.some(line => 
        line.includes(env) && (line.includes('Production') || line.includes('All'))
      )
      const existsInPreview = lines.some(line => 
        line.includes(env) && (line.includes('Preview') || line.includes('All'))
      )
      const existsInDevelopment = lines.some(line => 
        line.includes(env) && (line.includes('Development') || line.includes('All'))
      )

      results.environment_variables.production[env] = existsInProduction ? 'present' : 'missing'
      results.environment_variables.preview[env] = existsInPreview ? 'present' : 'missing'
      results.environment_variables.development[env] = existsInDevelopment ? 'present' : 'missing'

      if (!existsInProduction) results.missing_vars.production.push(env)
      if (!existsInPreview) results.missing_vars.preview.push(env)
      if (!existsInDevelopment) results.missing_vars.development.push(env)

      const status = existsInProduction && existsInPreview ? '✅' : '❌'
      console.log(`   ${status} ${env}`)
      if (!existsInProduction) console.log(`      ⚠️  Faltando em Production`)
      if (!existsInPreview) console.log(`      ⚠️  Faltando em Preview`)
    }
  } else {
    console.log(`   ⚠️  Não foi possível listar envs: ${envsResult.error}\n`)
    results.errors.push(`Failed to list env vars: ${envsResult.error}`)
    console.log('   ℹ️  Verifique manualmente no Vercel Dashboard\n')
  }

  // Gerar CRON_SECRET se ausente
  console.log('\n3. Verificando CRON_SECRET...')
  const cronSecretMissing = 
    results.missing_vars.production.includes('CRON_SECRET') ||
    results.missing_vars.preview.includes('CRON_SECRET')

  if (cronSecretMissing) {
    const newSecret = generateCronSecret()
    results.cron_secret_generated = newSecret
    
    console.log(`   ⚠️  CRON_SECRET não encontrado`)
    console.log(`   🔑 Gerando novo CRON_SECRET...`)
    console.log(`\n   ${newSecret}\n`)
    console.log(`   📋 Para adicionar no Vercel, execute:`)
    console.log(`   vercel env add CRON_SECRET production`)
    console.log(`   vercel env add CRON_SECRET preview\n`)
    console.log(`   Ou copie o valor acima e adicione manualmente no Vercel Dashboard\n`)
  } else {
    console.log(`   ✅ CRON_SECRET encontrado\n`)
  }

  // Salvar relatório
  const outputPath = path.join(__dirname, '..', 'VERCEL_ENV_CHECK.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`📄 Relatório salvo em: ${outputPath}`)

  return results
}

checkVercelEnv()
  .then(() => {
    console.log('\n✅ Verificação concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error)
    process.exit(1)
  })

