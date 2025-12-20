/**
 * Script para Corrigir TODAS as Referências em Inglês
 * 
 * Corrige interfaces, tipos, nomes de tabelas e qualquer outra referência
 * que não esteja usando os termos corretos em português:
 * - operador (não operator)
 * - motorista (não driver)
 * - veiculo (não vehicle)
 * - passageiro (não passenger)
 * - transportadora (não carrier)
 * - empresa (company pode estar correto em alguns contextos, mas verificar)
 */

const fs = require('fs')
const path = require('path')

// Mapeamentos completos (incluindo interfaces, tipos, tabelas, etc.)
const REPLACEMENTS = [
  // Interfaces e Tipos TypeScript
  { pattern: /\binterface\s+Driver\b/g, replacement: 'interface Motorista', description: 'interface Motorista → interface Motorista' },
  { pattern: /\binterface\s+Vehicle\b/g, replacement: 'interface Veiculo', description: 'interface Veiculo → interface Veiculo' },
  { pattern: /\binterface\s+Carrier\b/g, replacement: 'interface Transportadora', description: 'interface Transportadora → interface Transportadora' },
  { pattern: /\binterface\s+Passenger\b/g, replacement: 'interface Passageiro', description: 'interface Passageiro → interface Passageiro' },
  { pattern: /\binterface\s+Operator\b/g, replacement: 'interface Operador', description: 'interface Operador → interface Operador' },
  
  { pattern: /\btype\s+Driver\b/g, replacement: 'type Motorista', description: 'type Motorista → type Motorista' },
  { pattern: /\btype\s+Vehicle\b/g, replacement: 'type Veiculo', description: 'type Veiculo → type Veiculo' },
  { pattern: /\btype\s+Carrier\b/g, replacement: 'type Transportadora', description: 'type Transportadora → type Transportadora' },
  { pattern: /\btype\s+Passenger\b/g, replacement: 'type Passageiro', description: 'type Passageiro → type Passageiro' },
  { pattern: /\btype\s+Operator\b/g, replacement: 'type Operador', description: 'type Operador → type Operador' },
  
  // Tipos compostos
  { pattern: /\bDriverDocumentType\b/g, replacement: 'MotoristaDocumentType', description: 'MotoristaDocumentType → MotoristaDocumentType' },
  { pattern: /\bVehicleDocumentType\b/g, replacement: 'VeiculoDocumentType', description: 'VeiculoDocumentType → VeiculoDocumentType' },
  { pattern: /\bCarrierDocumentType\b/g, replacement: 'TransportadoraDocumentType', description: 'TransportadoraDocumentType → TransportadoraDocumentType' },
  { pattern: /\bPassengerDocumentType\b/g, replacement: 'PassageiroDocumentType', description: 'PassageiroDocumentType → PassageiroDocumentType' },
  
  { pattern: /\bDriverCompensation\b/g, replacement: 'MotoristaCompensation', description: 'MotoristaCompensation → MotoristaCompensation' },
  { pattern: /\bVehicleCostSummary\b/g, replacement: 'VeiculoCostSummary', description: 'VeiculoCostSummary → VeiculoCostSummary' },
  { pattern: /\bCarrierBankingData\b/g, replacement: 'TransportadoraBankingData', description: 'TransportadoraBankingData → TransportadoraBankingData' },
  { pattern: /\bCarrierLegalRepData\b/g, replacement: 'TransportadoraLegalRepData', description: 'TransportadoraLegalRepData → TransportadoraLegalRepData' },
  
  // Props de componentes
  { pattern: /\bDriverModalProps\b/g, replacement: 'MotoristaModalProps', description: 'MotoristaModalProps → MotoristaModalProps' },
  { pattern: /\bVehicleModalProps\b/g, replacement: 'VeiculoModalProps', description: 'VeiculoModalProps → VeiculoModalProps' },
  { pattern: /\bCarrierModalProps\b/g, replacement: 'TransportadoraModalProps', description: 'TransportadoraModalProps → TransportadoraModalProps' },
  { pattern: /\bPassengerModalProps\b/g, replacement: 'PassageiroModalProps', description: 'PassageiroModalProps → PassageiroModalProps' },
  { pattern: /\bOperatorModalProps\b/g, replacement: 'OperadorModalProps', description: 'OperadorModalProps → OperadorModalProps' },
  
  { pattern: /\bDriverPickerModalProps\b/g, replacement: 'MotoristaPickerModalProps', description: 'MotoristaPickerModalProps → MotoristaPickerModalProps' },
  { pattern: /\bVehiclePickerModalProps\b/g, replacement: 'VeiculoPickerModalProps', description: 'VeiculoPickerModalProps → VeiculoPickerModalProps' },
  
  { pattern: /\bDriverCompensationSectionProps\b/g, replacement: 'MotoristaCompensationSectionProps', description: 'MotoristaCompensationSectionProps → MotoristaCompensationSectionProps' },
  { pattern: /\bDriverDocumentsSectionProps\b/g, replacement: 'MotoristaDocumentsSectionProps', description: 'MotoristaDocumentsSectionProps → MotoristaDocumentsSectionProps' },
  { pattern: /\bVehicleDocumentsSectionProps\b/g, replacement: 'VeiculoDocumentsSectionProps', description: 'VeiculoDocumentsSectionProps → VeiculoDocumentsSectionProps' },
  { pattern: /\bCarrierDocumentsSectionProps\b/g, replacement: 'TransportadoraDocumentsSectionProps', description: 'TransportadoraDocumentsSectionProps → TransportadoraDocumentsSectionProps' },
  { pattern: /\bCarrierBankingSectionProps\b/g, replacement: 'TransportadoraBankingSectionProps', description: 'TransportadoraBankingSectionProps → TransportadoraBankingSectionProps' },
  { pattern: /\bCarrierLegalRepSectionProps\b/g, replacement: 'TransportadoraLegalRepSectionProps', description: 'TransportadoraLegalRepSectionProps → TransportadoraLegalRepSectionProps' },
  
  // Outros tipos
  { pattern: /\bDriverDocument\b/g, replacement: 'MotoristaDocument', description: 'MotoristaDocument → MotoristaDocument' },
  { pattern: /\bVehicleDocument\b/g, replacement: 'VeiculoDocument', description: 'VeiculoDocument → VeiculoDocument' },
  { pattern: /\bCarrierDocument\b/g, replacement: 'TransportadoraDocument', description: 'TransportadoraDocument → TransportadoraDocument' },
  { pattern: /\bPassengerDocument\b/g, replacement: 'PassageiroDocument', description: 'PassageiroDocument → PassageiroDocument' },
  
  { pattern: /\bDriverMetrics\b/g, replacement: 'MotoristaMetrics', description: 'MotoristaMetrics → MotoristaMetrics' },
  { pattern: /\bDriverSLA\b/g, replacement: 'MotoristaSLA', description: 'MotoristaSLA → MotoristaSLA' },
  { pattern: /\bVehicleMaintenance\b/g, replacement: 'VeiculoMaintenance', description: 'VeiculoMaintenance → VeiculoMaintenance' },
  { pattern: /\bVehicleChecklist\b/g, replacement: 'VeiculoChecklist', description: 'VeiculoChecklist → VeiculoChecklist' },
  { pattern: /\bVehiclePositionUpdate\b/g, replacement: 'VeiculoPositionUpdate', description: 'VeiculoPositionUpdate → VeiculoPositionUpdate' },
  { pattern: /\bVehiclePanelProps\b/g, replacement: 'VeiculoPanelProps', description: 'VeiculoPanelProps → VeiculoPanelProps' },
  { pattern: /\bPassengerInfo\b/g, replacement: 'PassageiroInfo', description: 'PassageiroInfo → PassageiroInfo' },
  { pattern: /\bPassengerDetails\b/g, replacement: 'PassageiroDetails', description: 'PassageiroDetails → PassageiroDetails' },
  { pattern: /\bCarrierMapProps\b/g, replacement: 'TransportadoraMapProps', description: 'TransportadoraMapProps → TransportadoraMapProps' },
  { pattern: /\bEditCarrierModalProps\b/g, replacement: 'EditTransportadoraModalProps', description: 'EditTransportadoraModalProps → EditTransportadoraModalProps' },
  { pattern: /\bAssociateOperatorModalProps\b/g, replacement: 'AssociateOperadorModalProps', description: 'AssociateOperadorModalProps → AssociateOperadorModalProps' },
  { pattern: /\bCreateOperatorModalProps\b/g, replacement: 'CreateOperadorModalProps', description: 'CreateOperadorModalProps → CreateOperadorModalProps' },
  { pattern: /\bCreateOperatorLoginModalProps\b/g, replacement: 'CreateOperadorLoginModalProps', description: 'CreateOperadorLoginModalProps → CreateOperadorLoginModalProps' },
  
  // Commands e Queries CQRS
  { pattern: /\bCreateDriverCommand\b/g, replacement: 'CreateMotoristaCommand', description: 'CreateMotoristaCommand → CreateMotoristaCommand' },
  { pattern: /\bCreateVehicleCommand\b/g, replacement: 'CreateVeiculoCommand', description: 'CreateVeiculoCommand → CreateVeiculoCommand' },
  { pattern: /\bCreateCarrierCommand\b/g, replacement: 'CreateTransportadoraCommand', description: 'CreateTransportadoraCommand → CreateTransportadoraCommand' },
  { pattern: /\bUpdateVehicleCommand\b/g, replacement: 'UpdateVeiculoCommand', description: 'UpdateVeiculoCommand → UpdateVeiculoCommand' },
  { pattern: /\bListVehiclesQuery\b/g, replacement: 'ListVeiculosQuery', description: 'ListVeiculosQuery → ListVeiculosQuery' },
  
  // Entity e Events
  { pattern: /\bVehicleProps\b/g, replacement: 'VeiculoProps', description: 'VeiculoProps → VeiculoProps' },
  { pattern: /\bVehicleUpdatedEventData\b/g, replacement: 'VeiculoUpdatedEventData', description: 'VeiculoUpdatedEventData → VeiculoUpdatedEventData' },
  
  // Test data
  { pattern: /\bTestVehicle\b/g, replacement: 'TestVeiculo', description: 'TestVeiculo → TestVeiculo' },
  { pattern: /\bTestDriver\b/g, replacement: 'TestMotorista', description: 'TestMotorista → TestMotorista' },
  
  // Stores
  { pattern: /\bOperatorFilters\b/g, replacement: 'OperadorFilters', description: 'OperadorFilters → OperadorFilters' },
  
  // Tabelas do banco (em SQL e strings)
  { pattern: /\bdriver_locations\b/g, replacement: 'motorista_locations', description: 'motorista_locations → motorista_locations' },
  { pattern: /\bdriver_messages\b/g, replacement: 'motorista_messages', description: 'motorista_messages → motorista_messages' },
  { pattern: /\bdriver_positions\b/g, replacement: 'motorista_positions', description: 'motorista_positions → motorista_positions' },
  { pattern: /\bpassenger_checkins\b/g, replacement: 'passageiro_checkins', description: 'passageiro_checkins → passageiro_checkins' },
  { pattern: /\bpassenger_cancellations\b/g, replacement: 'passageiro_cancellations', description: 'passageiro_cancellations → passageiro_cancellations' },
  { pattern: /\bvehicle_checklists\b/g, replacement: 'veiculo_checklists', description: 'veiculo_checklists → veiculo_checklists' },
  { pattern: /\bgf_vehicle_checklists\b/g, replacement: 'gf_veiculo_checklists', description: 'gf_veiculo_checklists → gf_veiculo_checklists' },
  { pattern: /\bgf_vehicle_documents\b/g, replacement: 'gf_veiculo_documents', description: 'gf_veiculo_documents → gf_veiculo_documents' },
  { pattern: /\bgf_driver_compensation\b/g, replacement: 'gf_motorista_compensation', description: 'gf_motorista_compensation → gf_motorista_compensation' },
  { pattern: /\bgf_carrier_documents\b/g, replacement: 'gf_transportadora_documents', description: 'gf_transportadora_documents → gf_transportadora_documents' },
  { pattern: /\btrip_passengers\b/g, replacement: 'trip_passageiros', description: 'trip_passageiros → trip_passageiros' },
  
  // Campos e propriedades
  { pattern: /\bdriver_id\b/g, replacement: 'motorista_id', description: 'motorista_id → motorista_id' },
  { pattern: /\bdriver_name\b/g, replacement: 'motorista_name', description: 'motorista_name → motorista_name' },
  { pattern: /\bvehicle_id\b/g, replacement: 'veiculo_id', description: 'veiculo_id → veiculo_id' },
  { pattern: /\bvehicle_type\b/g, replacement: 'veiculo_type', description: 'veiculo_type → veiculo_type' },
  { pattern: /\bpassenger_id\b/g, replacement: 'passageiro_id', description: 'passageiro_id → passageiro_id' },
  { pattern: /\bcarrier_id\b/g, replacement: 'transportadora_id', description: 'transportadora_id → transportadora_id' },
  
  // Strings e mensagens
  { pattern: /'motorista_document'/g, replacement: "'motorista_document'", description: "'motorista_document' → 'motorista_document'" },
  { pattern: /'veiculo_document'/g, replacement: "'veiculo_document'", description: "'veiculo_document' → 'veiculo_document'" },
  { pattern: /'veiculo_maintenance'/g, replacement: "'veiculo_maintenance'", description: "'veiculo_maintenance' → 'veiculo_maintenance'" },
  { pattern: /'veiculo_checklist'/g, replacement: "'veiculo_checklist'", description: "'veiculo_checklist' → 'veiculo_checklist'" },
  { pattern: /'create_operador'/g, replacement: "'create_operador'", description: "'create_operador' → 'create_operador'" },
  { pattern: /'motorista_ranking'/g, replacement: "'motorista_ranking'", description: "'motorista_ranking' → 'motorista_ranking'" },
  
  // Constantes e labels
  { pattern: /\bDRIVER_DOCUMENT_LABELS\b/g, replacement: 'MOTORISTA_DOCUMENT_LABELS', description: 'MOTORISTA_DOCUMENT_LABELS → MOTORISTA_DOCUMENT_LABELS' },
  { pattern: /\bVEHICLE_DOCUMENT_LABELS\b/g, replacement: 'VEICULO_DOCUMENT_LABELS', description: 'VEICULO_DOCUMENT_LABELS → VEICULO_DOCUMENT_LABELS' },
  { pattern: /\bCARRIER_DOCUMENT_LABELS\b/g, replacement: 'TRANSPORTADORA_DOCUMENT_LABELS', description: 'TRANSPORTADORA_DOCUMENT_LABELS → TRANSPORTADORA_DOCUMENT_LABELS' },
  { pattern: /\bREQUIRED_DRIVER_DOCUMENTS\b/g, replacement: 'REQUIRED_MOTORISTA_DOCUMENTS', description: 'REQUIRED_MOTORISTA_DOCUMENTS → REQUIRED_MOTORISTA_DOCUMENTS' },
  { pattern: /\bREQUIRED_VEHICLE_DOCUMENTS\b/g, replacement: 'REQUIRED_VEICULO_DOCUMENTS', description: 'REQUIRED_VEICULO_DOCUMENTS → REQUIRED_VEICULO_DOCUMENTS' },
  { pattern: /\bREQUIRED_CARRIER_DOCUMENTS\b/g, replacement: 'REQUIRED_TRANSPORTADORA_DOCUMENTS', description: 'REQUIRED_TRANSPORTADORA_DOCUMENTS → REQUIRED_TRANSPORTADORA_DOCUMENTS' },
]

// Diretórios a processar
const DIRECTORIES = [
  'apps/web',
  'apps/mobile',
  'supabase/migrations',
  'scripts',
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
  'package-lock.json',
  'types/supabase.ts', // Será regenerado
  'docs/MIGRACAO_NOMENCLATURA_PT_BR_COMPLETA.md', // Documentação histórica
  'docs/PADRONIZACAO_NOMENCLATURA_PT_BR.md', // Documentação histórica
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
  console.log('🚀 Iniciando correção de TODAS as referências em inglês...\n')
  
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
  
  console.log('\n✅ Correção concluída!')
  console.log('\n⚠️  PRÓXIMOS PASSOS:')
  console.log('1. Verificar se o build ainda passa')
  console.log('2. Verificar se há erros de TypeScript')
  console.log('3. Testar funcionalidades críticas')
  console.log('4. Criar migration SQL para renomear tabelas do banco')
}

// Executar
main()

