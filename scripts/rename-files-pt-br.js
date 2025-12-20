/**
 * Script para Renomear Arquivos de operator para operador
 * 
 * Renomeia arquivos que contêm "operator" no nome para "operador"
 */

const fs = require('fs')
const path = require('path')

// Mapeamentos de renomeação
const RENAMES = [
  { from: 'operator', to: 'operador' },
  { from: 'Operator', to: 'Operador' },
  { from: 'OPERATOR', to: 'OPERADOR' },
]

// Diretórios a processar
const DIRECTORIES = [
  'apps/web/components',
  'apps/web/lib',
  'apps/web/app',
  'apps/web/__tests__',
  'apps/web/stores',
]

// Extensões de arquivo a processar
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Arquivos/pastas a ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
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
 * Renomeia um arquivo
 */
function renameFile(oldPath, newPath) {
  try {
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      fs.renameSync(oldPath, newPath)
      return true
    }
    return false
  } catch (error) {
    console.error(`❌ Erro ao renomear ${oldPath}:`, error.message)
    return false
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
        // Processar subdiretório recursivamente
        const subResults = processDirectory(fullPath)
        results.push(...subResults)
      } else if (entry.isFile() && shouldProcessFile(fullPath)) {
        // Verificar se o nome do arquivo precisa ser renomeado
        for (const { from, to } of RENAMES) {
          if (entry.name.includes(from)) {
            const newName = entry.name.replace(new RegExp(from, 'g'), to)
            if (newName !== entry.name) {
              const newPath = path.join(dirPath, newName)
              if (renameFile(fullPath, newPath)) {
                results.push({ oldPath: fullPath, newPath, from, to })
              }
            }
          }
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
  console.log('🚀 Iniciando renomeação de arquivos...\n')
  
  const allResults = []
  
  // Processar cada diretório
  for (const dir of DIRECTORIES) {
    const dirPath = path.join(process.cwd(), dir)
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Processando: ${dir}`)
      const results = processDirectory(dirPath)
      allResults.push(...results)
      console.log(`   ✅ ${results.length} arquivo(s) renomeado(s)\n`)
    } else {
      console.log(`⚠️  Diretório não encontrado: ${dir}\n`)
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60))
  console.log(`Total de arquivos renomeados: ${allResults.length}\n`)
  
  if (allResults.length > 0) {
    console.log('Arquivos renomeados:')
    allResults.forEach(({ oldPath, newPath, from, to }) => {
      console.log(`  ${from} → ${to}`)
      console.log(`    ${oldPath}`)
      console.log(`    → ${newPath}\n`)
    })
  }
  
  console.log('\n✅ Renomeação concluída!')
  console.log('\n⚠️  PRÓXIMOS PASSOS:')
  console.log('1. Atualizar imports que referenciam os arquivos renomeados')
  console.log('2. Executar testes para garantir que tudo funciona')
  console.log('3. Verificar se há referências em outros arquivos')
}

// Executar
main()

