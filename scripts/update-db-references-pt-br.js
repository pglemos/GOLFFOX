/**
 * Script para Atualizar Referências de Tabelas/Views do Banco de Dados
 * 
 * Atualiza todas as referências de operator para operador no código
 */

const fs = require('fs')
const path = require('path')

// Mapeamentos de referências do banco de dados
const DB_REPLACEMENTS = [
  // Tabelas
  { pattern: /\bgf_operator_settings\b/g, replacement: 'gf_operador_settings', description: 'gf_operador_settings → gf_operador_settings' },
  { pattern: /\bgf_operator_incidents\b/g, replacement: 'gf_operador_incidents', description: 'gf_operador_incidents → gf_operador_incidents' },
  { pattern: /\bgf_operator_documents\b/g, replacement: 'gf_operador_documents', description: 'gf_operador_documents → gf_operador_documents' },
  { pattern: /\bgf_operator_audits\b/g, replacement: 'gf_operador_audits', description: 'gf_operador_audits → gf_operador_audits' },
  
  // Views
  { pattern: /\bv_operator_dashboard_kpis\b/g, replacement: 'v_operador_dashboard_kpis', description: 'v_operador_dashboard_kpis → v_operador_dashboard_kpis' },
  { pattern: /\bv_operator_dashboard_kpis_secure\b/g, replacement: 'v_operador_dashboard_kpis_secure', description: 'v_operador_dashboard_kpis_secure → v_operador_dashboard_kpis_secure' },
  { pattern: /\bv_operator_routes\b/g, replacement: 'v_operador_routes', description: 'v_operador_routes → v_operador_routes' },
  { pattern: /\bv_operator_routes_secure\b/g, replacement: 'v_operador_routes_secure', description: 'v_operador_routes_secure → v_operador_routes_secure' },
  { pattern: /\bv_operator_alerts\b/g, replacement: 'v_operador_alerts', description: 'v_operador_alerts → v_operador_alerts' },
  { pattern: /\bv_operator_alerts_secure\b/g, replacement: 'v_operador_alerts_secure', description: 'v_operador_alerts_secure → v_operador_alerts_secure' },
  { pattern: /\bv_operator_costs\b/g, replacement: 'v_operador_costs', description: 'v_operador_costs → v_operador_costs' },
  { pattern: /\bv_operator_costs_secure\b/g, replacement: 'v_operador_costs_secure', description: 'v_operador_costs_secure → v_operador_costs_secure' },
  { pattern: /\bv_operator_assigned_carriers\b/g, replacement: 'v_operador_assigned_carriers', description: 'v_operador_assigned_carriers → v_operador_assigned_carriers' },
  { pattern: /\bv_operator_kpis\b/g, replacement: 'v_operador_kpis', description: 'v_operador_kpis → v_operador_kpis' },
  
  // Materialized Views
  { pattern: /\bmv_operator_kpis\b/g, replacement: 'mv_operador_kpis', description: 'mv_operador_kpis → mv_operador_kpis' },
  
  // Funções
  { pattern: /\brefresh_mv_operator_kpis\b/g, replacement: 'refresh_mv_operador_kpis', description: 'refresh_mv_operador_kpis → refresh_mv_operador_kpis' },
]

// Diretórios a processar
const DIRECTORIES = [
  'apps/web',
  'apps/mobile',
  'scripts',
  'docs',
]

// Extensões de arquivo a processar
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.sql']

// Arquivos/pastas a ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'types/supabase.ts', // Este arquivo será atualizado separadamente via regeneração
]

/**
 * Verifica se arquivo deve ser processado
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath)
  if (!FILE_EXTENSIONS.includes(ext)) return false
  
  const relativePath = path.relative(process.cwd(), filePath)
  return !IGNORE_PATTERNS.some(pattern => relativePath.includes(pattern))
}

/**
 * Processa um arquivo
 */
function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    const changes = []
    
    // Aplicar todas as substituições
    for (const { pattern, replacement, description } of DB_REPLACEMENTS) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        content = content.replace(pattern, replacement)
        modified = true
        changes.push(`${description}: ${matches.length} ocorrência(s)`)
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      return { filePath, changes }
    }
    
    return null
  } catch (error) {
    console.error(`❌ Erro ao processar ${filePath}:`, error.message)
    return null
  }
}

/**
 * Processa um diretório recursivamente
 */
function processDirectory(dirPath) {
  const results = []
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        const subResults = processDirectory(fullPath)
        results.push(...subResults)
      } else if (entry.isFile() && shouldProcessFile(fullPath)) {
        const result = processFile(fullPath)
        if (result) {
          results.push(result)
        }
      }
    }
  } catch (error) {
    console.error(`❌ Erro ao processar diretório ${dirPath}:`, error.message)
  }
  
  return results
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando atualização de referências do banco de dados...\n')
  
  const allResults = []
  
  // Processar cada diretório
  for (const dir of DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir)
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processando: ${dir}`)
      const results = processDirectory(dirPath)
      allResults.push(...results)
      console.log(`   ✅ ${results.length} arquivo(s) modificado(s)\n`)
    } else {
      console.log(`⚠️  Diretório não encontrado: ${dir}\n`)
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60))
  console.log(`Total de arquivos modificados: ${allResults.length}\n`)
  
  if (allResults.length > 0) {
    console.log('Arquivos modificados:')
    allResults.forEach(({ filePath, changes }) => {
      console.log(`\n  📄 ${filePath}`)
      changes.forEach(change => console.log(`     - ${change}`))
    })
  }
  
  console.log('\n✅ Atualização concluída!')
  console.log('\n⚠️  PRÓXIMOS PASSOS:')
  console.log('1. Aplicar migration SQL no Supabase')
  console.log('2. Regenerar types/supabase.ts (se necessário)')
  console.log('3. Executar testes para garantir que tudo funciona')
}

// Executar
main()

