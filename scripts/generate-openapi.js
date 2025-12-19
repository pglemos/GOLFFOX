/**
 * Script para gerar openapi.json a partir de openapi.yaml (fonte única)
 * 
 * Uso:
 *   node scripts/generate-openapi.js
 * 
 * Este script garante que todos os arquivos openapi.json estejam sincronizados
 * com a fonte única openapi.yaml
 */

const fs = require('fs')
const path = require('path')

// Tentar usar biblioteca yaml, fallback para js-yaml ou parsing manual
let yaml
try {
  yaml = require('yaml')
} catch {
  try {
    yaml = require('js-yaml')
  } catch {
    // Fallback: usar JSON direto se YAML não disponível
    console.warn('⚠️  Biblioteca YAML não encontrada. Instale com: npm install yaml ou npm install js-yaml')
    yaml = null
  }
}

const SOURCE_FILE = path.join(__dirname, '../apps/web/openapi.yaml')
const OUTPUT_FILES = [
  path.join(__dirname, '../docs/api/openapi.json'),
  path.join(__dirname, '../apps/web/public/openapi.json'),
]

function generateOpenAPI() {
  try {
    // Ler arquivo YAML fonte
    if (!fs.existsSync(SOURCE_FILE)) {
      console.error(`❌ Arquivo fonte não encontrado: ${SOURCE_FILE}`)
      process.exit(1)
    }

    const yamlContent = fs.readFileSync(SOURCE_FILE, 'utf-8')
    let jsonContent
    if (yaml) {
      jsonContent = yaml.parse(yamlContent)
    } else {
      // Se não há parser YAML, tentar ler JSON direto (se openapi.json já existe)
      console.warn('⚠️  Usando fallback: lendo openapi.json diretamente')
      const jsonPath = path.join(__dirname, '../docs/api/openapi.json')
      if (fs.existsSync(jsonPath)) {
        jsonContent = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      } else {
        throw new Error('Biblioteca YAML não disponível e openapi.json não encontrado. Instale: npm install yaml')
      }
    }

    // Validar estrutura básica
    if (!jsonContent.openapi || !jsonContent.info) {
      console.error('❌ Arquivo YAML inválido: estrutura OpenAPI não encontrada')
      process.exit(1)
    }

    // Gerar JSON formatado
    const jsonString = JSON.stringify(jsonContent, null, 2)

    // Escrever em todos os arquivos de destino
    let successCount = 0
    for (const outputFile of OUTPUT_FILES) {
      try {
        // Criar diretório se não existir
        const outputDir = path.dirname(outputFile)
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }

        fs.writeFileSync(outputFile, jsonString, 'utf-8')
        console.log(`✅ Gerado: ${path.relative(process.cwd(), outputFile)}`)
        successCount++
      } catch (error) {
        console.error(`❌ Erro ao escrever ${outputFile}:`, error.message)
      }
    }

    if (successCount === OUTPUT_FILES.length) {
      console.log(`\n✅ Sucesso! ${successCount} arquivo(s) gerado(s) a partir de ${path.relative(process.cwd(), SOURCE_FILE)}`)
      return 0
    } else {
      console.error(`\n⚠️  Aviso: Apenas ${successCount}/${OUTPUT_FILES.length} arquivo(s) foram gerados`)
      return 1
    }
  } catch (error) {
    console.error('❌ Erro ao gerar OpenAPI:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const exitCode = generateOpenAPI()
  process.exit(exitCode)
}

module.exports = { generateOpenAPI }
