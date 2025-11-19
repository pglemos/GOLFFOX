#!/usr/bin/env node

/**
 * Script de Teste Autônomo para Responsividade Mobile
 * Verifica se todas as páginas e componentes seguem os padrões de responsividade
 */

const fs = require('fs')
const path = require('path')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const results = {
  passed: [],
  failed: [],
  warnings: []
}

// Padrões que devem estar presentes
const requiredPatterns = {
  buttons: {
    mobile: /min-h-\[44px\]|btn-mobile|min-h-11/,
    responsive: /w-full sm:w-auto|flex-1 sm:flex-initial/
  },
  text: {
    breakWords: /break-words|overflow-wrap|word-break/,
    responsive: /text-xs sm:text-sm|text-sm sm:text-base|text-base sm:text-lg/
  },
  layout: {
    responsive: /flex-col sm:flex-row|grid-cols-1 sm:grid-cols-2|grid-cols-2 sm:grid-cols-4/,
    overflow: /overflow-x-hidden|overflow-hidden/
  },
  modals: {
    width: /w-\[95vw\]|w-\[90vw\]/,
    padding: /p-4 sm:p-6|p-3 sm:p-4/
  },
  containers: {
    fullWidth: /w-full/,
    spacing: /space-y-4 sm:space-y-6|gap-3 sm:gap-4/
  }
}

// Padrões que não devem estar presentes (problemas)
const problematicPatterns = {
  fixedWidth: /w-\[100px\]|w-\[200px\]|w-\[300px\]/,
  noBreak: /whitespace-nowrap(?!.*sm:)/,
  smallButtons: /h-6|h-7|h-8(?!.*sm:)/,
  overflow: /overflow-x-auto(?!.*sm:)/,
  fixedPadding: /p-\[20px\]|p-\[30px\]/
}

function checkFile(filePath, content) {
  const relativePath = path.relative(process.cwd(), filePath)
  const issues = []
  const checks = []

  // Verificar se é uma página ou modal
  const isPage = filePath.includes('/app/') && filePath.endsWith('page.tsx')
  const isModal = filePath.includes('modal') || filePath.includes('Modal')
  const isComponent = filePath.includes('/components/')

  // Verificar botões
  const buttonMatches = content.match(/<Button[^>]*>/g) || []
  if (buttonMatches.length > 0) {
    buttonMatches.forEach((btn, idx) => {
      const hasMobileHeight = requiredPatterns.buttons.mobile.test(btn)
      const hasResponsive = requiredPatterns.buttons.responsive.test(btn)
      
      if (!hasMobileHeight && !btn.includes('no-touch-size')) {
        issues.push({
          type: 'error',
          message: `Botão ${idx + 1} sem altura mínima mobile (min-h-[44px] ou btn-mobile)`,
          line: content.substring(0, content.indexOf(btn)).split('\n').length
        })
      } else {
        checks.push({ type: 'pass', message: `Botão ${idx + 1} com altura mobile adequada` })
      }
    })
  }

  // Verificar textos longos
  const textElements = content.match(/<h[1-6][^>]*>|<p[^>]*>|<span[^>]*>/g) || []
  const hasBreakWords = requiredPatterns.text.breakWords.test(content)
  if (textElements.length > 5 && !hasBreakWords && isPage) {
    issues.push({
      type: 'warning',
      message: 'Muitos elementos de texto sem break-words'
    })
  }

  // Verificar layouts
  const hasResponsiveLayout = requiredPatterns.layout.responsive.test(content)
  const hasOverflow = requiredPatterns.layout.overflow.test(content)
  
  if (isPage && !hasResponsiveLayout && content.includes('flex') && !content.includes('flex-col sm:flex-row')) {
    issues.push({
      type: 'warning',
      message: 'Layout flex sem classes responsivas'
    })
  }

  if (isPage && !hasOverflow) {
    issues.push({
      type: 'warning',
      message: 'Container sem overflow-x-hidden'
    })
  }

  // Verificar modais
  if (isModal) {
    const hasModalWidth = requiredPatterns.modals.width.test(content)
    const hasModalPadding = requiredPatterns.modals.padding.test(content)
    
    if (!hasModalWidth) {
      issues.push({
        type: 'error',
        message: 'Modal sem largura responsiva (w-[95vw] ou w-[90vw])'
      })
    }
    
    if (!hasModalPadding) {
      issues.push({
        type: 'warning',
        message: 'Modal sem padding responsivo'
      })
    }
  }

  // Verificar padrões problemáticos
  Object.entries(problematicPatterns).forEach(([name, pattern]) => {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        issues.push({
          type: 'warning',
          message: `Padrão problemático encontrado: ${name} - "${match.substring(0, 30)}"`
        })
      })
    }
  })

  // Verificar se tem classes Tailwind responsivas
  const hasResponsiveClasses = /sm:|md:|lg:|xl:/.test(content)
  if (isPage && !hasResponsiveClasses && content.length > 1000) {
    issues.push({
      type: 'warning',
      message: 'Página sem classes responsivas Tailwind'
    })
  }

  return { issues, checks, relativePath }
}

function scanDirectory(dir, fileList = []) {
  try {
    if (!fs.existsSync(dir)) {
      return fileList
    }

    const files = fs.readdirSync(dir)

    files.forEach(file => {
      const filePath = path.join(dir, file)
      
      try {
        const stat = fs.statSync(filePath)

        if (stat.isDirectory()) {
          // Ignorar node_modules, .next, etc
          if (!['node_modules', '.next', '.git', 'dist', 'build', '__pycache__', '.turbo'].includes(file) && !file.startsWith('.')) {
            scanDirectory(filePath, fileList)
          }
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          // Adicionar todos os arquivos .tsx e .ts encontrados
          fileList.push(filePath)
        }
      } catch (err) {
        // Ignorar erros de permissão ou arquivos inacessíveis
        console.warn(`Aviso: Não foi possível acessar ${filePath}: ${err.message}`)
      }
    })
  } catch (err) {
    console.warn(`Aviso: Não foi possível ler diretório ${dir}: ${err.message}`)
  }

  return fileList
}

function runTests() {
  console.log(`${colors.cyan}🚀 Iniciando testes de responsividade mobile...${colors.reset}\n`)

  // Ajustar caminhos baseado no diretório atual
  let baseDir = process.cwd()
  
  // Se estamos em apps/web, usar como base
  if (baseDir.endsWith('apps\\web') || baseDir.endsWith('apps/web')) {
    // Já estamos no diretório correto
  } else if (baseDir.endsWith('web')) {
    // Estamos em web, usar como base
  } else {
    // Tentar encontrar apps/web
    const possiblePath = path.join(baseDir, 'apps', 'web')
    if (fs.existsSync(possiblePath)) {
      baseDir = possiblePath
    }
  }

  const appDir = path.join(baseDir, 'app')
  const componentsDir = path.join(baseDir, 'components')
  
  console.log(`${colors.blue}📂 Diretório base: ${baseDir}${colors.reset}`)
  console.log(`${colors.blue}📂 App dir: ${appDir}${colors.reset}`)
  console.log(`${colors.blue}📂 Components dir: ${componentsDir}${colors.reset}\n`)

  const filesToCheck = []

  if (fs.existsSync(appDir)) {
    filesToCheck.push(...scanDirectory(appDir))
  }
  if (fs.existsSync(componentsDir)) {
    filesToCheck.push(...scanDirectory(componentsDir))
  }

  console.log(`${colors.blue}📁 Arquivos encontrados: ${filesToCheck.length}${colors.reset}\n`)

  filesToCheck.forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const { issues, checks, relativePath } = checkFile(filePath, content)

      if (issues.length === 0 && checks.length > 0) {
        results.passed.push({
          file: relativePath,
          checks: checks.length
        })
      } else {
        issues.forEach(issue => {
          if (issue.type === 'error') {
            results.failed.push({
              file: relativePath,
              issue: issue.message,
              line: issue.line
            })
          } else {
            results.warnings.push({
              file: relativePath,
              issue: issue.message
            })
          }
        })
      }
    } catch (error) {
      results.failed.push({
        file: path.relative(process.cwd(), filePath),
        issue: `Erro ao ler arquivo: ${error.message}`
      })
    }
  })

  // Gerar relatório
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.cyan}           RELATÓRIO DE TESTES${colors.reset}`)
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`)

  console.log(`${colors.green}✅ Arquivos sem problemas: ${results.passed.length}${colors.reset}`)
  if (results.passed.length > 0) {
    results.passed.slice(0, 10).forEach(item => {
      console.log(`   ${colors.green}✓${colors.reset} ${item.file} (${item.checks} checks)`)
    })
    if (results.passed.length > 10) {
      console.log(`   ... e mais ${results.passed.length - 10} arquivos`)
    }
  }

  console.log(`\n${colors.yellow}⚠️  Avisos: ${results.warnings.length}${colors.reset}`)
  if (results.warnings.length > 0) {
    results.warnings.slice(0, 10).forEach(item => {
      console.log(`   ${colors.yellow}⚠${colors.reset} ${item.file}`)
      console.log(`      ${item.issue}`)
    })
    if (results.warnings.length > 10) {
      console.log(`   ... e mais ${results.warnings.length - 10} avisos`)
    }
  }

  console.log(`\n${colors.red}❌ Erros encontrados: ${results.failed.length}${colors.reset}`)
  if (results.failed.length > 0) {
    results.failed.forEach(item => {
      console.log(`   ${colors.red}✗${colors.reset} ${item.file}`)
      console.log(`      ${item.issue}`)
      if (item.line) {
        console.log(`      Linha: ${item.line}`)
      }
    })
  }

  // Estatísticas
  const totalFiles = filesToCheck.length
  const successRate = ((results.passed.length / totalFiles) * 100).toFixed(1)

  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`)
  console.log(`${colors.cyan}           ESTATÍSTICAS${colors.reset}`)
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`)

  console.log(`Total de arquivos verificados: ${totalFiles}`)
  console.log(`${colors.green}Arquivos OK: ${results.passed.length} (${successRate}%)${colors.reset}`)
  console.log(`${colors.yellow}Avisos: ${results.warnings.length}${colors.reset}`)
  console.log(`${colors.red}Erros: ${results.failed.length}${colors.reset}`)

  // Status final
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`)
  if (results.failed.length === 0) {
    console.log(`${colors.green}✅ TODOS OS TESTES PASSARAM!${colors.reset}`)
    console.log(`${colors.green}   Responsividade mobile está correta!${colors.reset}\n`)
    process.exit(0)
  } else {
    console.log(`${colors.red}❌ ALGUNS TESTES FALHARAM${colors.reset}`)
    console.log(`${colors.yellow}   Corrija os erros acima antes de continuar${colors.reset}\n`)
    process.exit(1)
  }
}

// Executar testes
runTests()

