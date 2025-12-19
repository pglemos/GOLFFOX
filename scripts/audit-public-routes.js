/**
 * Script para auditar rotas públicas (sem requireAuth)
 * Identifica endpoints que podem precisar de proteção
 */

const fs = require('fs')
const path = require('path')
const { glob } = require('glob')

const API_DIR = path.join(__dirname, '../apps/web/app/api')

// Rotas que são legítimas públicas (comparar com caminho da rota sem /api e sem /route.ts)
const LEGITIMATE_PUBLIC_ROUTES = [
  'health',
  'auth/login',
  'auth/csrf',
  'docs/openapi',
  'webhooks/incoming', // Já protegido com HMAC
  'analytics/web-vitals', // Analytics público
  'cep', // Busca CEP pode ser pública para formulários
  'send-email', // Pode ser pública para formulários de contato
]

// Rotas que devem ser apenas desenvolvimento
const DEV_ONLY_ROUTES = [
  'test-session',
  'auth/seed-admin',
  'auth/fix-test-user',
  'auth/fix-transportadora-user',
]

async function auditRoutes() {
  const routeFiles = await glob('**/route.ts', { cwd: API_DIR })
  const results = {
    public: [],
    protected: [],
    needsReview: [],
  }

  for (const file of routeFiles) {
    const fullPath = path.join(API_DIR, file)
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // Extrair caminho da rota (sem /api e sem /route.ts)
    const routePath = '/' + file.replace(/\/route\.ts$/, '').replace(/\\/g, '/')
    const routeKey = file.replace(/\/route\.ts$/, '').replace(/\\/g, '/')
    
    // Verificar se usa requireAuth
    const hasRequireAuth = content.includes('requireAuth') || content.includes('requireCompanyAccess')
    const hasApplyRateLimit = content.includes('applyRateLimit')
    
    // Verificar se é uma rota pública legítima (comparar com routeKey, não routePath)
    const isLegitimatePublic = LEGITIMATE_PUBLIC_ROUTES.some(legit => routeKey === legit || routeKey.startsWith(legit + '/'))
    const isDevOnly = DEV_ONLY_ROUTES.some(dev => routeKey === dev || routeKey.startsWith(dev + '/'))
    
    if (!hasRequireAuth) {
      if (isLegitimatePublic) {
        results.public.push({
          route: routePath,
          file,
          hasRateLimit: hasApplyRateLimit,
          status: 'OK - Pública legítima' + (hasApplyRateLimit ? ' (tem rate limit)' : ' (PRECISA rate limit)'),
        })
      } else if (isDevOnly) {
        results.public.push({
          route: routePath,
          file,
          hasRateLimit: hasApplyRateLimit,
          status: 'DEV ONLY - Verificar se tem proteção NODE_ENV',
        })
      } else {
        results.needsReview.push({
          route: routePath,
          file,
          hasRateLimit: hasApplyRateLimit,
          status: 'PRECISA REVISÃO - Sem requireAuth mas não é rota pública conhecida',
        })
      }
    } else {
      results.protected.push({
        route: routePath,
        file,
        hasRateLimit: hasApplyRateLimit,
        status: 'OK - Protegida',
      })
    }
  }

  return results
}

async function main() {
  console.log('🔍 Auditando rotas públicas...\n')
  
  const results = await auditRoutes()
  
  console.log(`✅ Rotas Protegidas: ${results.protected.length}`)
  console.log(`⚠️  Rotas Públicas Legítimas: ${results.public.length}`)
  console.log(`🚨 Rotas que Precisam Revisão: ${results.needsReview.length}\n`)
  
  if (results.needsReview.length > 0) {
    console.log('🚨 ROTAS QUE PRECISAM REVISÃO:\n')
    results.needsReview.forEach(({ route, file, status }) => {
      console.log(`  ${route}`)
      console.log(`    Arquivo: ${file}`)
      console.log(`    Status: ${status}\n`)
    })
  }
  
  const publicWithoutRateLimit = results.public.filter(r => !r.hasRateLimit)
  if (publicWithoutRateLimit.length > 0) {
    console.log('⚠️  ROTAS PÚBLICAS SEM RATE LIMIT:\n')
    publicWithoutRateLimit.forEach(({ route, file }) => {
      console.log(`  ${route} (${file})\n`)
    })
  }
  
  // Salvar relatório
  const reportPath = path.join(__dirname, '../docs/auditoria/public-routes-audit.json')
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))
  console.log(`\n📄 Relatório salvo em: ${reportPath}`)
}

main().catch(console.error)
