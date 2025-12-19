/**
 * Script de Correção Automática de Qualidade de Código
 * 
 * Corrige automaticamente:
 * - Tipos any para unknown
 * - Imports duplicados
 * - logger.log/warn para funções estruturadas
 */

const fs = require('fs')
const path = require('path')

const WEB_DIR = path.join(__dirname, '..', 'apps', 'web')
const API_DIR = path.join(WEB_DIR, 'app', 'api')

let fixed = 0
let checked = 0

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    let modified = false

    // 1. Corrigir catch (error: any) para catch (error: unknown)
    const anyCatchRegex = /catch\s*\(\s*error\s*:\s*any\s*\)/g
    if (anyCatchRegex.test(content)) {
      content = content.replace(anyCatchRegex, 'catch (error: unknown)')
      modified = true
    }

    // 2. Corrigir error.message para error instanceof Error ? error.message : 'Erro desconhecido'
    if (content.includes('catch (error: unknown)') || content.includes('catch (error: any)')) {
      const errorMessageRegex = /error\.message/g
      const matches = content.match(errorMessageRegex)
      if (matches && content.includes('catch')) {
        // Substituir error.message em contextos de catch
        const lines = content.split('\n')
        let inCatch = false
        const newLines = lines.map((line, idx) => {
          if (line.includes('catch')) inCatch = true
          if (line.includes('}') && inCatch) inCatch = false
          
          if (inCatch && line.includes('error.message') && !line.includes('error instanceof Error')) {
            // Verificar se já não está protegido
            if (!line.includes('error instanceof Error')) {
              // Substituir apenas se for uma atribuição direta
              if (line.match(/message:\s*error\.message/)) {
                return line.replace(/message:\s*error\.message/, "message: error instanceof Error ? error.message : 'Erro desconhecido'")
              }
            }
          }
          return line
        })
        if (newLines.join('\n') !== content) {
          content = newLines.join('\n')
          modified = true
        }
      }
    }

    // 3. Remover imports duplicados de logger
    const loggerImportRegex = /import\s*{\s*logger\s*,\s*logError\s*}\s*from\s*['"]@\/lib\/logger['"]/g
    if (loggerImportRegex.test(content)) {
      // Verificar se logger é usado
      if (!content.match(/logger\.(log|warn|info|debug|error)/)) {
        content = content.replace(loggerImportRegex, "import { logError } from '@/lib/logger'")
        modified = true
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf-8')
      fixed++
      return true
    }
    return false
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message)
    return false
  }
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      walkDir(filePath, callback)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath)
    }
  }
}

console.log('🔧 Iniciando correção automática de qualidade de código...\n')

walkDir(API_DIR, (filePath) => {
  checked++
  if (fixFile(filePath)) {
    console.log(`✅ Corrigido: ${path.relative(WEB_DIR, filePath)}`)
  }
})

console.log(`\n📊 Resumo:`)
console.log(`   - Arquivos verificados: ${checked}`)
console.log(`   - Arquivos corrigidos: ${fixed}`)
console.log(`\n✅ Correção concluída!`)
