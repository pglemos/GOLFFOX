/**
 * Script para Corrigir TODAS as Referências Restantes em Inglês
 * 
 * Busca e corrige qualquer referência a:
 * - operator/Operator → operador/Operador
 * - driver/Driver → motorista/Motorista
 * - vehicle/Vehicle → veiculo/Veiculo
 * - passenger/Passenger → passageiro/Passageiro
 * - carrier/Carrier → transportadora/Transportadora
 * 
 * EXCETO em:
 * - Arquivos de documentação histórica (docs/)
 * - Arquivos de migration SQL (supabase/migrations/)
 * - Arquivos de teste que testam comportamento antigo
 * - node_modules, .git, dist, build
 */

const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.join(__dirname, '..')

// Diretórios e arquivos a IGNORAR
const IGNORE_PATTERNS = [
  /node_modules/,
  /\.git/,
  /dist/,
  /build/,
  /coverage/,
  /\.next/,
  /package-lock\.json/,
  /yarn\.lock/,
  /pnpm-lock\.yaml/,
  /\.log$/,
  /\.cache/,
  /docs\/.*\.md$/, // Documentação histórica
  /supabase\/migrations\/.*\.sql$/, // Migrations SQL (podem referenciar nomes antigos)
  /scripts\/.*\.js$/, // Scripts de migração
  /testsprite_tests/, // Testes automatizados
  /\.drawio$/, // Diagramas
  /README\.md$/, // README pode ter exemplos
]

// Extensões de arquivo para processar
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

// Mapeamentos de correção
const REPLACEMENTS = [
  // operator → operador
  { pattern: /\boperator\b/g, replacement: 'operador', description: 'operator → operador' },
  { pattern: /\bOperator\b/g, replacement: 'Operador', description: 'Operator → Operador' },
  { pattern: /\bOPERATOR\b/g, replacement: 'OPERADOR', description: 'OPERATOR → OPERADOR' },
  
  // driver → motorista
  { pattern: /\bdriver\b/g, replacement: 'motorista', description: 'driver → motorista' },
  { pattern: /\bDriver\b/g, replacement: 'Motorista', description: 'Driver → Motorista' },
  { pattern: /\bDRIVER\b/g, replacement: 'MOTORISTA', description: 'DRIVER → MOTORISTA' },
  
  // vehicle → veiculo
  { pattern: /\bvehicle\b/g, replacement: 'veiculo', description: 'vehicle → veiculo' },
  { pattern: /\bVehicle\b/g, replacement: 'Veiculo', description: 'Vehicle → Veiculo' },
  { pattern: /\bVEHICLE\b/g, replacement: 'VEICULO', description: 'VEHICLE → VEICULO' },
  
  // passenger → passageiro
  { pattern: /\bpassenger\b/g, replacement: 'passageiro', description: 'passenger → passageiro' },
  { pattern: /\bPassenger\b/g, replacement: 'Passageiro', description: 'Passenger → Passageiro' },
  { pattern: /\bPASSENGER\b/g, replacement: 'PASSAGEIRO', description: 'PASSENGER → PASSAGEIRO' },
  
  // carrier → transportadora
  { pattern: /\bcarrier\b/g, replacement: 'transportadora', description: 'carrier → transportadora' },
  { pattern: /\bCarrier\b/g, replacement: 'Transportadora', description: 'Carrier → Transportadora' },
  { pattern: /\bCARRIER\b/g, replacement: 'TRANSPORTADORA', description: 'CARRIER → TRANSPORTADORA' },
]

// Exceções - palavras que NÃO devem ser substituídas
const EXCEPTIONS = [
  'company', // company é correto (empresa em português)
  'Company', // Company é correto
  'COMPANY', // COMPANY é correto
  'companies', // companies é correto
  'Companies', // Companies é correto
]

/**
 * Verificar se arquivo deve ser processado
 */
function shouldProcessFile(filePath) {
  // Verificar padrões de ignorar
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(filePath)) {
      return false
    }
  }
  
  // Verificar extensão
  const ext = path.extname(filePath)
  if (!FILE_EXTENSIONS.includes(ext)) {
    return false
  }
  
  return true
}

/**
 * Processar arquivo
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let newContent = content
    let modified = false
    const changes = []
    
    // Aplicar cada substituição
    for (const replacement of REPLACEMENTS) {
      // Verificar se há match
      if (replacement.pattern.test(newContent)) {
        // Verificar exceções
        const matches = newContent.match(replacement.pattern)
        if (matches) {
          let shouldReplace = true
          for (const match of matches) {
            // Verificar se não é exceção
            for (const exception of EXCEPTIONS) {
              if (match.toLowerCase().includes(exception.toLowerCase())) {
                shouldReplace = false
                break
              }
            }
            if (shouldReplace) {
              break
            }
          }
          
          if (shouldReplace) {
            newContent = newContent.replace(replacement.pattern, replacement.replacement)
            modified = true
            changes.push(replacement.description)
          }
        }
      }
    }
    
    // Salvar se modificado
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8')
      return { modified: true, changes }
    }
    
    return { modified: false, changes: [] }
  } catch (error) {
    console.error(`   ❌ Erro ao processar ${filePath}:`, error.message)
    return { modified: false, changes: [], error: error.message }
  }
}

/**
 * Processar diretório recursivamente
 */
function processDirectory(dirPath) {
  const results = {
    processed: 0,
    modified: 0,
    errors: 0,
    files: []
  }
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name)
      
      if (entry.isDirectory()) {
        const subResults = processDirectory(fullPath)
        results.processed += subResults.processed
        results.modified += subResults.modified
        results.errors += subResults.errors
        results.files.push(...subResults.files)
      } else if (entry.isFile()) {
        if (shouldProcessFile(fullPath)) {
          results.processed++
          const result = processFile(fullPath)
          
          if (result.modified) {
            results.modified++
            results.files.push({
              path: fullPath,
              changes: result.changes
            })
            console.log(`   ✅ ${path.relative(ROOT_DIR, fullPath)}`)
            if (result.changes.length > 0) {
              result.changes.forEach(change => console.log(`      - ${change}`))
            }
          }
          
          if (result.error) {
            results.errors++
          }
        }
      }
    }
  } catch (error) {
    console.error(`   ❌ Erro ao processar diretório ${dirPath}:`, error.message)
    results.errors++
  }
  
  return results
}

/**
 * Função principal
 */
function main() {
  console.log('🚀 Iniciando correção de referências restantes...\n')
  console.log('='.repeat(60))
  
  const directories = [
    path.join(ROOT_DIR, 'apps', 'web'),
    path.join(ROOT_DIR, 'apps', 'mobile'),
  ]
  
  let totalResults = {
    processed: 0,
    modified: 0,
    errors: 0,
    files: []
  }
  
  for (const dir of directories) {
    if (fs.existsSync(dir)) {
      console.log(`\n📂 Processando: ${path.relative(ROOT_DIR, dir)}`)
      const results = processDirectory(dir)
      totalResults.processed += results.processed
      totalResults.modified += results.modified
      totalResults.errors += results.errors
      totalResults.files.push(...results.files)
    }
  }
  
  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO')
  console.log('='.repeat(60))
  console.log(`\n✅ Arquivos processados: ${totalResults.processed}`)
  console.log(`✅ Arquivos modificados: ${totalResults.modified}`)
  console.log(`❌ Erros: ${totalResults.errors}`)
  
  if (totalResults.files.length > 0) {
    console.log(`\n📝 Arquivos modificados:`)
    totalResults.files.forEach(file => {
      console.log(`   - ${path.relative(ROOT_DIR, file.path)}`)
    })
  }
  
  console.log('\n✅ Processo concluído!')
}

main()

