/**
 * Script para Corrigir TODAS as Variáveis e Componentes em Inglês
 * 
 * Corrige:
 * - selectedDriver → selectedMotorista
 * - selectedVehicle → selectedVeiculo
 * - isDriverModalOpen → isMotoristaModalOpen
 * - isVehicleModalOpen → isVeiculoModalOpen
 * - drivers → motoristas
 * - vehicles → veiculos
 * - DriverModal → MotoristaModal
 * - VehicleModal → VeiculoModal
 * - DriverPickerModal → MotoristaPickerModal
 * - VehiclePickerModal → VeiculoPickerModal
 */

const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.join(__dirname, '..')

// Diretórios a processar
const DIRECTORIES = [
  path.join(ROOT_DIR, 'apps', 'web'),
  path.join(ROOT_DIR, 'apps', 'mobile'),
]

// Padrões de ignorar
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
  /docs\//, // Documentação
  /supabase\/migrations\//, // Migrations SQL
  /scripts\//, // Scripts de migração
  /testsprite_tests/, // Testes automatizados
]

// Extensões de arquivo
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

// Mapeamentos de correção
const REPLACEMENTS = [
  // Variáveis de estado
  { pattern: /\bselectedDriver\b/g, replacement: 'selectedMotorista', description: 'selectedDriver → selectedMotorista' },
  { pattern: /\bselectedVehicle\b/g, replacement: 'selectedVeiculo', description: 'selectedVehicle → selectedVeiculo' },
  { pattern: /\bsetSelectedDriver\b/g, replacement: 'setSelectedMotorista', description: 'setSelectedDriver → setSelectedMotorista' },
  { pattern: /\bsetSelectedVehicle\b/g, replacement: 'setSelectedVeiculo', description: 'setSelectedVehicle → setSelectedVeiculo' },
  
  // Modais
  { pattern: /\bisDriverModalOpen\b/g, replacement: 'isMotoristaModalOpen', description: 'isDriverModalOpen → isMotoristaModalOpen' },
  { pattern: /\bisVehicleModalOpen\b/g, replacement: 'isVeiculoModalOpen', description: 'isVehicleModalOpen → isVeiculoModalOpen' },
  { pattern: /\bsetIsDriverModalOpen\b/g, replacement: 'setIsMotoristaModalOpen', description: 'setIsDriverModalOpen → setIsMotoristaModalOpen' },
  { pattern: /\bsetIsVehicleModalOpen\b/g, replacement: 'setIsVeiculoModalOpen', description: 'setIsVehicleModalOpen → setIsVeiculoModalOpen' },
  
  // Arrays
  { pattern: /\bdrivers\b/g, replacement: 'motoristas', description: 'drivers → motoristas' },
  { pattern: /\bvehicles\b/g, replacement: 'veiculos', description: 'vehicles → veiculos' },
  { pattern: /\bsetDrivers\b/g, replacement: 'setMotoristas', description: 'setDrivers → setMotoristas' },
  { pattern: /\bsetVehicles\b/g, replacement: 'setVeiculos', description: 'setVehicles → setVeiculos' },
  
  // Componentes
  { pattern: /\bDriverModal\b/g, replacement: 'MotoristaModal', description: 'DriverModal → MotoristaModal' },
  { pattern: /\bVehicleModal\b/g, replacement: 'VeiculoModal', description: 'VehicleModal → VeiculoModal' },
  { pattern: /\bDriverPickerModal\b/g, replacement: 'MotoristaPickerModal', description: 'DriverPickerModal → MotoristaPickerModal' },
  { pattern: /\bVehiclePickerModal\b/g, replacement: 'VeiculoPickerModal', description: 'VehiclePickerModal → VeiculoPickerModal' },
  
  // Props e interfaces
  { pattern: /\bselectedDriver\b/g, replacement: 'selectedMotorista', description: 'selectedDriver → selectedMotorista' },
  { pattern: /\bselectedVehicle\b/g, replacement: 'selectedVeiculo', description: 'selectedVehicle → selectedVeiculo' },
  { pattern: /\bonOpenDriverModal\b/g, replacement: 'onOpenMotoristaModal', description: 'onOpenDriverModal → onOpenMotoristaModal' },
  { pattern: /\bonOpenVehicleModal\b/g, replacement: 'onOpenVeiculoModal', description: 'onOpenVehicleModal → onOpenVeiculoModal' },
]

/**
 * Verificar se arquivo deve ser processado
 */
function shouldProcessFile(filePath) {
  for (const pattern of IGNORE_PATTERNS) {
    if (pattern.test(filePath)) {
      return false
    }
  }
  
  const ext = path.extname(filePath)
  return FILE_EXTENSIONS.includes(ext)
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
    
    for (const replacement of REPLACEMENTS) {
      if (replacement.pattern.test(newContent)) {
        newContent = newContent.replace(replacement.pattern, replacement.replacement)
        modified = true
        changes.push(replacement.description)
      }
    }
    
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
 * Processar diretório
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
  console.log('🚀 Corrigindo variáveis e componentes em inglês...\n')
  console.log('='.repeat(60))
  
  let totalResults = {
    processed: 0,
    modified: 0,
    errors: 0,
    files: []
  }
  
  for (const dir of DIRECTORIES) {
    if (fs.existsSync(dir)) {
      console.log(`\n📂 Processando: ${path.relative(ROOT_DIR, dir)}`)
      const results = processDirectory(dir)
      totalResults.processed += results.processed
      totalResults.modified += results.modified
      totalResults.errors += results.errors
      totalResults.files.push(...results.files)
    }
  }
  
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

