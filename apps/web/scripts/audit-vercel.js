/**
 * Script: Auditoria Vercel
 * Coleta informações sobre projeto, vercel.json e estrutura de arquivos
 */

const fs = require('fs')
const path = require('path')

const PROJECT_ID = 'prj_SWzDURzEoQFej5hzbcvDHbFJ6K2m'
const TEAM_ID = 'team_9kUTSaoIkwnAVxy9nXMcAnej'
const PROJECT_NAME = 'golffox'
const DOMAIN = 'golffox.vercel.app'

const requiredEnvs = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  'CRON_SECRET',
  'RESEND_API_KEY'
]

async function auditVercel() {
  const audit = {
    timestamp: new Date().toISOString(),
    project: {
      id: PROJECT_ID,
      name: PROJECT_NAME,
      team_id: TEAM_ID,
      domain: DOMAIN
    },
    vercel_json: null,
    cron_jobs: [],
    api_routes: [],
    environment_variables_required: requiredEnvs,
    errors: []
  }

  console.log('Auditando configuração Vercel...\n')

  // 1. Verificar vercel.json
  console.log('1. Verificando vercel.json...')
  const vercelJsonPath = path.join(__dirname, '..', 'vercel.json')
  if (fs.existsSync(vercelJsonPath)) {
    try {
      audit.vercel_json = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'))
      if (audit.vercel_json.crons) {
        audit.cron_jobs = audit.vercel_json.crons
        console.log(`   ${audit.vercel_json.crons.length} cron jobs configurados`)
        audit.vercel_json.crons.forEach(cron => {
          console.log(`   - ${cron.path} (${cron.schedule})`)
        })
      }
    } catch (error) {
      audit.errors.push(`Erro ao ler vercel.json: ${error.message}`)
      console.log(`   Erro ao ler vercel.json: ${error.message}`)
    }
  } else {
    audit.errors.push('vercel.json não encontrado')
    console.log('   vercel.json não encontrado')
  }

  // 2. Verificar rotas de API
  console.log('\n2. Verificando rotas de API...')
  const apiDir = path.join(__dirname, '..', 'app', 'api')
  if (fs.existsSync(apiDir)) {
    const apiRoutes = []
    function scanApiDir(dir, prefix = '') {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          scanApiDir(fullPath, `${prefix}/${entry.name}`)
        } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
          apiRoutes.push({
            path: prefix || '/api',
            file: fullPath.replace(path.join(__dirname, '..'), '')
          })
        }
      })
    }
    scanApiDir(apiDir)
    audit.api_routes = apiRoutes
    console.log(`   ${apiRoutes.length} rotas de API encontradas`)
    apiRoutes.slice(0, 10).forEach(route => {
      console.log(`   - ${route.path}`)
    })
    if (apiRoutes.length > 10) {
      console.log(`   ... e mais ${apiRoutes.length - 10} rotas`)
    }
  }

  // 3. Verificar estrutura Next.js
  console.log('\n3. Verificando estrutura Next.js...')
  const appDir = path.join(__dirname, '..', 'app')
  const pagesDir = path.join(__dirname, '..', 'pages')
  audit.nextjs_structure = {
    uses_app_router: fs.existsSync(appDir),
    uses_pages_router: fs.existsSync(pagesDir)
  }
  console.log(`   App Router: ${audit.nextjs_structure.uses_app_router ? 'Sim' : 'Não'}`)
  console.log(`   Pages Router: ${audit.nextjs_structure.uses_pages_router ? 'Sim' : 'Não'}`)

  // 4. Verificar arquivos de configuração
  console.log('\n4. Verificando arquivos de configuração...')
  const configFiles = {
    'next.config.js': path.join(__dirname, '..', 'next.config.js'),
    'next.config.mjs': path.join(__dirname, '..', 'next.config.mjs'),
    'package.json': path.join(__dirname, '..', 'package.json'),
    '.env.local': path.join(__dirname, '..', '.env.local'),
    '.env.example': path.join(__dirname, '..', '.env.example')
  }
  
  audit.config_files = {}
  Object.entries(configFiles).forEach(([name, filePath]) => {
    const exists = fs.existsSync(filePath)
    audit.config_files[name] = exists
    if (exists) {
      console.log(`   ${name}: existe`)
    }
  })

  // 5. Verificar cron jobs esperados
  console.log('\n5. Verificando cron jobs esperados...')
  const expectedCrons = [
    { path: '/api/cron/refresh-kpis', schedule: '*/5 * * * *' },
    { path: '/api/cron/dispatch-reports', schedule: '*/15 * * * *' }
  ]
  
  audit.cron_validation = {
    expected: expectedCrons,
    configured: audit.cron_jobs,
    all_configured: expectedCrons.every(expected => 
      audit.cron_jobs.some(cron => cron.path === expected.path)
    )
  }
  
  if (audit.cron_validation.all_configured) {
    console.log('   Todos os cron jobs esperados estão configurados')
  } else {
    console.log('   Alguns cron jobs esperados não estão configurados')
    expectedCrons.forEach(expected => {
      const found = audit.cron_jobs.some(cron => cron.path === expected.path)
      console.log(`   ${found ? '✓' : '✗'} ${expected.path}`)
    })
  }

  // Salvar relatório
  const outputPath = path.join(__dirname, '..', 'VERCEL_STATUS.json')
  fs.writeFileSync(outputPath, JSON.stringify(audit, null, 2))
  console.log(`\nRelatório salvo em: ${outputPath}`)

  return audit
}

auditVercel()
  .then(() => {
    console.log('\nAuditoria concluída!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nErro fatal:', error)
    process.exit(1)
  })

