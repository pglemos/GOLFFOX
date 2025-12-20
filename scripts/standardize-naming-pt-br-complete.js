/**
 * Script de Padronização Completa de Nomenclatura PT-BR
 * 
 * Padroniza TODOS os termos em inglês para português em:
 * - Código (TypeScript, JavaScript, TSX, JSX)
 * - Documentação (Markdown)
 * - Banco de dados (SQL migrations)
 * - Configurações (JSON, YAML)
 * 
 * Mapeamentos:
 * - operador → operador
 * - motorista → motorista
 * - veiculo → veiculo
 * - company → empresa (já está correto na maioria dos lugares)
 * - passageiro → passageiro
 * - transportadora → transportadora
 */

const fs = require('fs')
const path = require('path')

// Mapeamentos de nomenclatura
const REPLACEMENTS = [
  // Roles e tipos de usuário
  { 
    pattern: /\boperator\b/gi, 
    replacement: 'operador',
    description: 'operador → operador'
  },
  { 
    pattern: /\bOperator\b/g, 
    replacement: 'Operador',
    description: 'operador → Operador'
  },
  { 
    pattern: /\bOPERATOR\b/g, 
    replacement: 'OPERADOR',
    description: 'operador → OPERADOR'
  },
  
  // motorista/Motorista
  { 
    pattern: /\bdriver\b/gi, 
    replacement: 'motorista',
    description: 'motorista → motorista'
  },
  { 
    pattern: /\bDriver\b/g, 
    replacement: 'Motorista',
    description: 'motorista → Motorista'
  },
  { 
    pattern: /\bDRIVER\b/g, 
    replacement: 'MOTORISTA',
    description: 'motorista → MOTORISTA'
  },
  
  // veiculo/Veículo
  { 
    pattern: /\bvehicle\b/gi, 
    replacement: 'veiculo',
    description: 'veiculo → veiculo'
  },
  { 
    pattern: /\bVehicle\b/g, 
    replacement: 'Veiculo',
    description: 'veiculo → Veiculo'
  },
  { 
    pattern: /\bVEHICLE\b/g, 
    replacement: 'VEICULO',
    description: 'veiculo → VEICULO'
  },
  
  // passageiro/Passageiro
  { 
    pattern: /\bpassenger\b/gi, 
    replacement: 'passageiro',
    description: 'passageiro → passageiro'
  },
  { 
    pattern: /\bPassenger\b/g, 
    replacement: 'Passageiro',
    description: 'passageiro → Passageiro'
  },
  { 
    pattern: /\bPASSENGER\b/g, 
    replacement: 'PASSAGEIRO',
    description: 'passageiro → PASSAGEIRO'
  },
  
  // transportadora/Transportadora
  { 
    pattern: /\bcarrier\b/gi, 
    replacement: 'transportadora',
    description: 'transportadora → transportadora'
  },
  { 
    pattern: /\bCarrier\b/g, 
    replacement: 'Transportadora',
    description: 'transportadora → Transportadora'
  },
  { 
    pattern: /\bCARRIER\b/g, 
    replacement: 'TRANSPORTADORA',
    description: 'transportadora → TRANSPORTADORA'
  },
]

// Diretórios a processar
const DIRECTORIES = [
  'apps/web',
  'apps/mobile',
  'docs',
  'supabase/migrations',
  'scripts',
]

// Extensões de arquivo a processar
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.md', '.sql', '.json', '.yaml', '.yml']

// Arquivos/pastas a ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  'package-lock.json',
  'yarn.lock',
  '.next',
  'coverage',
  '.turbo',
]

// Arquivos específicos a ignorar (nomes de arquivos que devem manter nomenclatura original)
const IGNORE_FILES = [
  'operador.json', // Arquivo i18n - será renomeado manualmente
]

/**
 * Verifica se arquivo deve ser processado
 */
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath)
  if (!FILE_EXTENSIONS.includes(ext)) return false
  
  const fileName = path.basename(filePath)
  if (IGNORE_FILES.includes(fileName)) return false
  
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
    for (const { pattern, replacement, description } of REPLACEMENTS) {
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
        // Processar subdiretório recursivamente
        const subResults = processDirectory(fullPath)
        results.push(...subResults)
      } else if (entry.isFile() && shouldProcessFile(fullPath)) {
        // Processar arquivo
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
  console.log('🚀 Iniciando padronização completa de nomenclatura PT-BR...\n')
  
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
  
  console.log('\n✅ Padronização concluída!')
  console.log('\n⚠️  PRÓXIMOS PASSOS:')
  console.log('1. Renomear arquivo: apps/web/i18n/operador.json → apps/web/i18n/operador.json')
  console.log('2. Atualizar imports que referenciam operador.json')
  console.log('3. Verificar se há nomes de arquivos/pastas que precisam ser renomeados')
  console.log('4. Executar testes para garantir que tudo funciona')
}

// Executar
main()

