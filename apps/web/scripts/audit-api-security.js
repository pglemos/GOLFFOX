/**
 * Script de Auditoria de Segurança das Rotas API
 * Versão JavaScript para execução direta
 */

const fs = require('fs').promises
const path = require('path')

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/csrf',
  '/api/auth/seed-admin',
  '/api/docs/openapi',
  '/api/test-session',
]

// Rotas que devem ser públicas mas podem ter validação opcional
const OPTIONAL_AUTH_ROUTES = [
  '/api/cep',
  '/api/analytics/web-vitals',
]

async function findRouteFiles(dir, basePath = '') {
  const files = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const routePath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      if (!['node_modules', '.next', 'coverage', '__tests__'].includes(entry.name)) {
        const subFiles = await findRouteFiles(fullPath, routePath)
        files.push(...subFiles)
      }
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      files.push(fullPath)
    }
  }

  return files
}

async function auditRoute(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const relativePath = filePath.replace(/.*\/app\/api/, '/api').replace(/\/route\.(ts|js)$/, '')
    
    const isPublic = PUBLIC_ROUTES.some(route => relativePath.startsWith(route)) ||
                     OPTIONAL_AUTH_ROUTES.some(route => relativePath.startsWith(route))

    const methods = []
    if (content.includes('export async function GET')) methods.push('GET')
    if (content.includes('export async function POST')) methods.push('POST')
    if (content.includes('export async function PUT')) methods.push('PUT')
    if (content.includes('export async function PATCH')) methods.push('PATCH')
    if (content.includes('export async function DELETE')) methods.push('DELETE')
    if (content.includes('export async function OPTIONS')) methods.push('OPTIONS')

    const hasRequireAuth = content.includes('requireAuth') || content.includes('await requireAuth')
    const hasValidateAuth = content.includes('validateAuth') || content.includes('await validateAuth')
    const importsAuth = content.includes("from '@/lib/api-auth'") || 
                        content.includes("from '../lib/api-auth'") ||
                        content.includes("from '../../lib/api-auth'")

    return {
      path: relativePath,
      hasRequireAuth,
      hasValidateAuth,
      isPublic,
      methods
    }
  } catch (error) {
    console.error(`Erro ao auditar ${filePath}:`, error)
    return null
  }
}

async function main() {
  const apiDir = path.join(process.cwd(), 'apps/web/app/api')
  
  try {
    const routeFiles = await findRouteFiles(apiDir)
    
    console.log(`\n🔍 Auditoria de Segurança das Rotas API`)
    console.log(`Total de rotas encontradas: ${routeFiles.length}\n`)

    const results = []
    const unprotected = []
    const warnings = []

    for (const file of routeFiles) {
      const info = await auditRoute(file)
      if (info) {
        results.push(info)
        
        if (!info.isPublic && !info.hasRequireAuth && !info.hasValidateAuth) {
          unprotected.push(info)
        }
        
        if (info.isPublic && info.path.includes('/admin/')) {
          warnings.push(info)
        }
      }
    }

    // Relatório
    console.log('📊 RESUMO DA AUDITORIA\n')
    console.log(`✅ Rotas auditadas: ${results.length}`)
    console.log(`🔒 Rotas protegidas com auth: ${results.filter(r => !r.isPublic && (r.hasRequireAuth || r.hasValidateAuth)).length}`)
    console.log(`🌐 Rotas públicas: ${results.filter(r => r.isPublic).length}`)
    console.log(`⚠️  Rotas desprotegidas: ${unprotected.length}`)
    console.log(`🔔 Avisos: ${warnings.length}\n`)

    if (unprotected.length > 0) {
      console.log('❌ ROTAS DESPROTEGIDAS (REQUEREM ATENÇÃO):\n')
      unprotected.forEach(route => {
        console.log(`  ${route.path}`)
        console.log(`    Métodos: ${route.methods.join(', ')}`)
        console.log(`    Status: SEM AUTENTICAÇÃO\n`)
      })
    }

    if (warnings.length > 0) {
      console.log('⚠️  AVISOS:\n')
      warnings.forEach(route => {
        console.log(`  ${route.path} - Rota pública em área admin?`)
      })
      console.log()
    }

    // Gerar relatório JSON
    const report = {
      timestamp: new Date().toISOString(),
      total: results.length,
      protected: results.filter(r => !r.isPublic && (r.hasRequireAuth || r.hasValidateAuth)).length,
      public: results.filter(r => r.isPublic).length,
      unprotected: unprotected.length,
      warnings: warnings.length,
      unprotectedRoutes: unprotected.map(r => ({
        path: r.path,
        methods: r.methods
      })),
      allRoutes: results
    }

    const reportPath = path.join(process.cwd(), 'apps/web/api-security-audit.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
    console.log('📄 Relatório completo salvo em: api-security-audit.json\n')

    // Exit code baseado em problemas encontrados
    process.exit(unprotected.length > 0 ? 1 : 0)
  } catch (error) {
    console.error('Erro ao executar auditoria:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { auditRoute, findRouteFiles }

