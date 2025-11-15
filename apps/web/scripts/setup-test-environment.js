#!/usr/bin/env node
/**
 * Script Master de Setup para Ambiente de Testes
 * Executa todas as etapas necessárias para configurar o ambiente de testes
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logStep(step, message) {
  console.log(`\n${colors.cyan}=== ${step} ===${colors.reset}`)
  console.log(message)
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`)
}

function logError(message) {
  console.error(`${colors.red}❌ ${message}${colors.reset}`)
}

function logWarning(message) {
  console.warn(`${colors.yellow}⚠️  ${message}${colors.reset}`)
}

async function runCommand(command, description) {
  try {
    logStep('EXECUTANDO', description)
    log(`Comando: ${command}`, 'bright')
    
    const output = execSync(command, {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      encoding: 'utf-8'
    })
    
    logSuccess(`${description} - Sucesso`)
    return { success: true, output }
  } catch (error) {
    logError(`${description} - Falhou`)
    logError(`Erro: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function checkEnvironment() {
  logStep('VERIFICANDO', 'Variáveis de Ambiente')
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  const optionalVars = [
    'CRON_SECRET',
    'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    'DATABASE_URL'
  ]
  
  // Carregar .env.local
  try {
    require('dotenv').config({ path: '.env.local' })
  } catch (e) {
    logWarning('dotenv não disponível, usando variáveis de ambiente do sistema')
  }
  
  const missing = []
  const present = []
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      present.push(varName)
      logSuccess(`${varName} está configurado`)
    } else {
      missing.push(varName)
      logError(`${varName} NÃO está configurado`)
    }
  }
  
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      log(`${varName} está configurado (opcional)`, 'green')
    } else {
      logWarning(`${varName} não está configurado (opcional)`)
    }
  }
  
  if (missing.length > 0) {
    logError(`\nFaltam variáveis obrigatórias: ${missing.join(', ')}`)
    logError('Configure essas variáveis no arquivo .env.local')
    logError('Veja .env.example para referência')
    return false
  }
  
  logSuccess('Todas as variáveis obrigatórias estão configuradas')
  return true
}

async function checkMigrations() {
  logStep('VERIFICANDO', 'Migrations do Banco de Dados')
  
  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations')
  
  if (!fs.existsSync(migrationsDir)) {
    logError('Diretório de migrations não encontrado')
    return false
  }
  
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
  
  if (migrationFiles.length === 0) {
    logWarning('Nenhuma migration encontrada')
    return false
  }
  
  logSuccess(`Encontradas ${migrationFiles.length} migration(s)`)
  migrationFiles.forEach((file, index) => {
    log(`  ${index + 1}. ${file}`)
  })
  
  logWarning('\n⚠️  IMPORTANTE: Execute as migrations manualmente no Supabase SQL Editor')
  logWarning('   O script run-migrations.js não pode executar SQL diretamente')
  logWarning('   Acesse: Supabase Dashboard > SQL Editor')
  logWarning('   Copie e execute o conteúdo de: database/migrations/001_initial_schema.sql')
  
  return true
}

async function setupTestEnvironment() {
  console.log(`${colors.bright}${colors.blue}`)
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   GolfFox - Setup de Ambiente de Testes                ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(colors.reset)
  
  const results = {
    environment: false,
    migrations: false,
    seedCompanies: false,
    seedUsers: false,
    seedCostCategories: false
  }
  
  // 1. Verificar ambiente
  results.environment = await checkEnvironment()
  if (!results.environment) {
    logError('\n❌ Setup abortado: Variáveis de ambiente não configuradas')
    process.exit(1)
  }
  
  // 2. Verificar migrations
  results.migrations = await checkMigrations()
  if (!results.migrations) {
    logWarning('\n⚠️  Migrations não encontradas ou não executadas')
    logWarning('   Continue apenas se as migrations já foram executadas manualmente')
  }
  
  // 3. Seed de empresas
  logStep('SEED', 'Criando empresa de teste')
  const seedCompaniesResult = await runCommand(
    'node scripts/seed-companies.js',
    'Seed de empresas'
  )
  results.seedCompanies = seedCompaniesResult.success
  
  // 4. Seed de usuários
  logStep('SEED', 'Criando usuários de teste')
  const seedUsersResult = await runCommand(
    'node scripts/seed-users.js',
    'Seed de usuários'
  )
  results.seedUsers = seedUsersResult.success
  
  // 5. Seed de categorias de custo
  logStep('SEED', 'Criando categorias de custo')
  const seedCostCategoriesResult = await runCommand(
    'node scripts/seed-cost-categories.js',
    'Seed de categorias de custo'
  )
  results.seedCostCategories = seedCostCategoriesResult.success
  
  // Resumo final
  console.log(`\n${colors.bright}${colors.blue}`)
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   RESUMO DO SETUP                                        ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(colors.reset)
  
  const allSuccess = Object.values(results).every(r => r)
  const someSuccess = Object.values(results).some(r => r)
  
  Object.entries(results).forEach(([key, success]) => {
    const label = {
      environment: 'Variáveis de Ambiente',
      migrations: 'Migrations do Banco',
      seedCompanies: 'Seed de Empresas',
      seedUsers: 'Seed de Usuários',
      seedCostCategories: 'Seed de Categorias'
    }[key] || key
    
    if (success) {
      logSuccess(`${label}: OK`)
    } else {
      logError(`${label}: FALHOU`)
    }
  })
  
  if (allSuccess) {
    logSuccess('\n🎉 Setup completo com sucesso!')
    logSuccess('Agora você pode executar os testes do TestSprite')
    console.log(`\n${colors.cyan}Próximos passos:${colors.reset}`)
    console.log('  1. Execute as migrations no Supabase SQL Editor (se ainda não fez)')
    console.log('  2. Verifique que o servidor está rodando: npm run dev')
    console.log('  3. Execute os testes: npx @testsprite/testsprite-mcp@latest reRunTests')
    process.exit(0)
  } else if (someSuccess) {
    logWarning('\n⚠️  Setup parcialmente completo')
    logWarning('Algumas etapas falharam. Verifique os erros acima.')
    console.log(`\n${colors.yellow}Próximos passos:${colors.reset}`)
    console.log('  1. Execute as migrations manualmente no Supabase SQL Editor')
    console.log('  2. Re-execute este script: node scripts/setup-test-environment.js')
    process.exit(1)
  } else {
    logError('\n❌ Setup falhou completamente')
    logError('Verifique os erros acima e tente novamente')
    process.exit(1)
  }
}

// Executar setup
setupTestEnvironment().catch(error => {
  logError(`\n❌ Erro fatal: ${error.message}`)
  console.error(error)
  process.exit(1)
})

