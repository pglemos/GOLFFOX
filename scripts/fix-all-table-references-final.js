/**
 * Script FINAL para corrigir TODAS as referências de tabelas antigas
 * Garante 100% de padronização PT-BR
 */

const fs = require('fs')
const path = require('path')

const REPLACEMENTS = [
  // Tabelas principais
  { 
    pattern: /\.from\(['"]carriers['"]\)/g, 
    replacement: ".from('transportadoras')", 
    description: 'carriers → transportadoras' 
  },
  { 
    pattern: /\.from\(['"]vehicles['"]\)/g, 
    replacement: ".from('veiculos')", 
    description: 'vehicles → veiculos' 
  },
  { 
    pattern: /\.from\(['"]drivers['"]\)/g, 
    replacement: ".from('motoristas')", 
    description: 'drivers → motoristas' 
  },
  { 
    pattern: /\.from\(['"]passengers['"]\)/g, 
    replacement: ".from('passageiros')", 
    description: 'passengers → passageiros' 
  },
  { 
    pattern: /\.from\(['"]operators['"]\)/g, 
    replacement: ".from('operadores')", 
    description: 'operators → operadores' 
  },
  
  // Tabelas gf_*
  { 
    pattern: /\.from\(['"]gf_carriers['"]\)/g, 
    replacement: ".from('gf_transportadoras')", 
    description: 'gf_carriers → gf_transportadoras' 
  },
  { 
    pattern: /\.from\(['"]gf_vehicles['"]\)/g, 
    replacement: ".from('gf_veiculos')", 
    description: 'gf_vehicles → gf_veiculos' 
  },
  { 
    pattern: /\.from\(['"]gf_drivers['"]\)/g, 
    replacement: ".from('gf_motoristas')", 
    description: 'gf_drivers → gf_motoristas' 
  },
  { 
    pattern: /\.from\(['"]gf_passengers['"]\)/g, 
    replacement: ".from('gf_passageiros')", 
    description: 'gf_passengers → gf_passageiros' 
  },
  { 
    pattern: /\.from\(['"]gf_operators['"]\)/g, 
    replacement: ".from('gf_operadores')", 
    description: 'gf_operators → gf_operadores' 
  },
  
  // Tabelas de documentos
  { 
    pattern: /\.from\(['"]gf_driver_documents['"]\)/g, 
    replacement: ".from('gf_motorista_documents')", 
    description: 'gf_driver_documents → gf_motorista_documents' 
  },
  { 
    pattern: /\.from\(['"]gf_carrier_documents['"]\)/g, 
    replacement: ".from('gf_transportadora_documents')", 
    description: 'gf_carrier_documents → gf_transportadora_documents' 
  },
  { 
    pattern: /\.from\(['"]gf_vehicle_documents['"]\)/g, 
    replacement: ".from('gf_veiculo_documents')", 
    description: 'gf_vehicle_documents → gf_veiculo_documents' 
  },
]

const IGNORE_PATTERNS = [
  /node_modules/,
  /\.next/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.cache/,
  /migrations\/.*\.sql$/, // Ignorar migrations SQL
  /docs\/.*\.md$/, // Ignorar documentação (pode ter exemplos)
]

const TARGET_DIRECTORIES = [
  'apps/web/app',
  'apps/web/lib',
  'apps/web/components',
  'apps/web/hooks',
  'apps/web/types',
]

function shouldIgnoreFile(filePath) {
  return IGNORE_PATTERNS.some(pattern => pattern.test(filePath))
}

function processFile(filePath) {
  if (shouldIgnoreFile(filePath)) {
    return { modified: false, changes: [] }
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    const changes = []

    for (const { pattern, replacement, description } of REPLACEMENTS) {
      const matches = content.match(pattern)
      if (matches) {
        content = content.replace(pattern, replacement)
        modified = true
        changes.push(description)
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
    }

    return { modified, changes }
  } catch (error) {
    console.error(`Erro ao processar ${filePath}:`, error.message)
    return { modified: false, changes: [], error: error.message }
  }
}

function findFiles(dir) {
  const files = []
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      
      if (shouldIgnoreFile(fullPath)) {
        continue
      }
      
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath)
      }
    }
  }
  
  walk(dir)
  return files
}

function main() {
  console.log('🔄 Verificação FINAL de referências de tabelas...\n')

  const allFiles = []
  for (const dir of TARGET_DIRECTORIES) {
    const fullPath = path.join(process.cwd(), dir)
    if (fs.existsSync(fullPath)) {
      allFiles.push(...findFiles(fullPath))
    }
  }

  console.log(`📁 Encontrados ${allFiles.length} arquivos para processar\n`)

  let totalModified = 0
  const allChanges = []

  for (const file of allFiles) {
    const result = processFile(file)
    if (result.modified) {
      totalModified++
      const relativePath = path.relative(process.cwd(), file)
      console.log(`✅ ${relativePath}`)
      result.changes.forEach(change => console.log(`   - ${change}`))
      allChanges.push({ file: relativePath, changes: result.changes })
    }
  }

  console.log('\n' + '='.repeat(70))
  console.log(`📊 Resumo:`)
  console.log(`   Arquivos processados: ${allFiles.length}`)
  console.log(`   Arquivos modificados: ${totalModified}`)
  console.log(`   Total de mudanças: ${allChanges.reduce((sum, f) => sum + f.changes.length, 0)}`)
  console.log('='.repeat(70))

  if (totalModified > 0) {
    console.log('\n✅ Referências corrigidas!')
  } else {
    console.log('\n✅ Nenhuma referência antiga encontrada - tudo está correto!')
  }
}

main()

