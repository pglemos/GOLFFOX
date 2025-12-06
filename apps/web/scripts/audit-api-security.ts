/**
 * Script de Auditoria de Segurança das Rotas API
 * Verifica se todas as rotas protegidas usam requireAuth
 */

import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

interface RouteInfo {
  path: string
  hasRequireAuth: boolean
  hasValidateAuth: boolean
  isPublic: boolean
  methods: string[]
}

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/api/health',
  '/api/auth/login',
  '/api/auth/csrf',
  '/api/auth/seed-admin', // Apenas em dev
  '/api/docs/openapi',
  '/api/test-session', // Apenas em dev
]

// Rotas que devem ser públicas mas podem ter validação opcional
const OPTIONAL_AUTH_ROUTES = [
  '/api/cep',
  '/api/analytics/web-vitals',
]

async function findRouteFiles(dir: string, basePath: string = ''): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const routePath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (entry.isDirectory()) {
      // Ignorar node_modules e outras pastas irrelevantes
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

async function auditRoute(filePath: string): Promise<RouteInfo | null> {
  try {
    const content = await readFile(filePath, 'utf-8')
    const relativePath = filePath.replace(/.*\/app\/api/, '/api').replace(/\/route\.(ts|js)$/, '')
    
    // Verificar se é rota pública
    const isPublic = PUBLIC_ROUTES.some(route => relativePath.startsWith(route)) ||
                     OPTIONAL_AUTH_ROUTES.some(route => relativePath.startsWith(route))

    // Detectar métodos HTTP
    const methods: string[] = []
    if (content.includes('export async function GET')) methods.push('GET')
    if (content.includes('export async function POST')) methods.push('POST')
    if (content.includes('export async function PUT')) methods.push('PUT')
    if (content.includes('export async function PATCH')) methods.push('PATCH')
    if (content.includes('export async function DELETE')) methods.push('DELETE')
    if (content.includes('export async function OPTIONS')) methods.push('OPTIONS')

    // Verificar uso de requireAuth ou validateAuth
    const hasRequireAuth = content.includes('requireAuth') || content.includes('await requireAuth')
    const hasValidateAuth = content.includes('validateAuth') || content.includes('await validateAuth')
    
    // Verificar se importa api-auth
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
  const apiDir = join(process.cwd(), 'apps/web/app/api')
  const routeFiles = await findRouteFiles(apiDir)
  
  console.log(`\n🔍 Auditoria de Segurança das Rotas API`)
  console.log(`Total de rotas encontradas: ${routeFiles.length}\n`)

  const results: RouteInfo[] = []
  const unprotected: RouteInfo[] = []
  const warnings: RouteInfo[] = []

  for (const file of routeFiles) {
    const info = await auditRoute(file)
    if (info) {
      results.push(info)
      
      // Verificar se rota protegida não tem autenticação
      if (!info.isPublic && !info.hasRequireAuth && !info.hasValidateAuth) {
        unprotected.push(info)
      }
      
      // Avisos para rotas que podem precisar de autenticação
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

  console.log('📄 Relatório completo salvo em: api-security-audit.json')
  await import('fs').then(fs => 
    fs.promises.writeFile(
      join(process.cwd(), 'apps/web/api-security-audit.json'),
      JSON.stringify(report, null, 2)
    )
  )

  // Exit code baseado em problemas encontrados
  process.exit(unprotected.length > 0 ? 1 : 0)
}

if (require.main === module) {
  main().catch(console.error)
}

export { auditRoute, findRouteFiles }

