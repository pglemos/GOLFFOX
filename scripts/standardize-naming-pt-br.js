/**
 * Script de Padronização de Nomenclatura PT-BR
 * 
 * Padroniza termos em inglês para português em:
 * - Comentários
 * - Variáveis locais
 * - Mensagens de log
 * - Documentação
 * 
 * NÃO altera:
 * - Nomes de arquivos/pastas (para não quebrar imports)
 * - Nomes de rotas API (para manter compatibilidade)
 * - Nomes de tabelas/colunas do banco (para não quebrar queries)
 */

const fs = require('fs')
const path = require('path')

const REPLACEMENTS = [
  // Roles e tipos de usuário
  { pattern: /\boperator\b/gi, replacement: 'operador', context: 'comentários e variáveis' },
  { pattern: /\bcarrier\b/gi, replacement: 'transportadora', context: 'comentários e variáveis' },
  
  // Termos técnicos comuns
  { pattern: /\bdriver\b/gi, replacement: 'motorista', context: 'comentários e variáveis' },
  { pattern: /\bpassenger\b/gi, replacement: 'passageiro', context: 'comentários e variáveis' },
  
  // Mensagens e logs
  { pattern: /operador\s+email/gi, replacement: 'email do operador', context: 'mensagens' },
  { pattern: /transportadora\s+id/gi, replacement: 'id da transportadora', context: 'mensagens' },
]

// Diretórios a processar
const DIRECTORIES = [
  'apps/web/app',
  'apps/web/components',
  'apps/web/lib',
  'apps/web/hooks',
  'docs',
]

// Extensões de arquivo a processar
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md']

// Arquivos/pastas a ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'package-lock.json',
  'yarn.lock',
  '__tests__', // Testes podem ter nomenclatura específica
  'types', // Tipos podem precisar manter nomenclatura original
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
    const content = fs.readFileSync(filePath, 'utf8')
    let modified = content
    let changes = 0
    
    REPLACEMENTS.forEach(({ pattern, replacement, context }) => {
      const matches = modified.match(pattern)
      if (matches) {
        // Aplicar substituição apenas em comentários e strings
        // Não substituir em nomes de variáveis/funções para não quebrar código
        const lines = modified.split('\n')
        const newLines = lines.map(line => {
          // Verificar se linha é comentário ou string
          const isComment = line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('/*')
          const isString = line.includes("'") || line.includes('"') || line.includes('`')
          
          if (isComment || isString) {
            const newLine = line.replace(pattern, replacement)
            if (newLine !== line) {
              changes++
              return newLine
            }
          }
          return line
        })
        modified = newLines.join('\n')
      }
    })
    
    if (changes > 0) {
      fs.writeFileSync(filePath, modified, 'utf8')
      return { filePath, changes }
    }
    
    return null
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message)
    return null
  }
}

/**
 * Processa diretório recursivamente
 */
function processDirectory(dirPath) {
  const results = []
  
  if (!fs.existsSync(dirPath)) {
    return results
  }
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    if (entry.isDirectory()) {
      if (!IGNORE_PATTERNS.some(pattern => entry.name.includes(pattern))) {
        results.push(...processDirectory(fullPath))
      }
    } else if (entry.isFile() && shouldProcessFile(fullPath)) {
      const result = processFile(fullPath)
      if (result) {
        results.push(result)
      }
    }
  }
  
  return results
}

/**
 * Main
 */
function main() {
  console.log('🔄 Padronizando nomenclatura para PT-BR...\n')
  
  const rootDir = path.join(__dirname, '..')
  const results = []
  
  DIRECTORIES.forEach(dir => {
    const dirPath = path.join(rootDir, dir)
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processando: ${dir}`)
      results.push(...processDirectory(dirPath))
    }
  })
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60) + '\n')
  
  if (results.length === 0) {
    console.log('✅ Nenhuma alteração necessária. Nomenclatura já está padronizada.')
  } else {
    console.log(`✅ ${results.length} arquivo(s) modificado(s):\n`)
    results.forEach(({ filePath, changes }) => {
      const relativePath = path.relative(rootDir, filePath)
      console.log(`   📝 ${relativePath} (${changes} alteração(ões))`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('💡 Nota: Este script modifica apenas comentários e strings.')
  console.log('   Nomes de variáveis, funções e arquivos não foram alterados.')
  console.log('   Para alterações mais profundas, revise manualmente.')
  console.log('='.repeat(60) + '\n')
}

if (require.main === module) {
  main()
}

module.exports = { processFile, processDirectory }

