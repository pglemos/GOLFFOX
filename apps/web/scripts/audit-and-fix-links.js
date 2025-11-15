/**
 * Script de Auditoria e Correção de Links
 * 
 * Verifica e corrige sistematicamente todas as referências a URLs do operador
 * em todo o sistema (código, banco de dados, configurações)
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

// Construir DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL

if (!DATABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  
  if (projectRef) {
    const password = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'Guigui1309@'
    DATABASE_URL = `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
  }
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada')
  process.exit(1)
}

// Padrões a buscar
const OLD_PATTERN = /operator\?company=[a-f0-9-]+/gi
const TEST_UUID = '11111111-1111-4111-8111-1111111111c1'
const CORRECT_LINK = 'https://golffox.vercel.app/operator'

const auditResults = {
  codeFiles: [],
  databaseRecords: [],
  configFiles: [],
  warnings: [],
  fixed: [],
  timestamp: new Date().toISOString()
}

/**
 * 1. AUDITORIA DE CÓDIGO
 */
async function auditCodeFiles() {
  console.log('\n📂 1. AUDITORIA DE ARQUIVOS DE CÓDIGO\n')
  
  const searchDirs = [
    path.join(__dirname, '../app'),
    path.join(__dirname, '../components'),
    path.join(__dirname, '../lib'),
    path.join(__dirname, '../pages'),
  ]

  let totalFiles = 0
  let filesWithIssues = 0

  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue
    
    const files = getAllFiles(dir, ['.tsx', '.ts', '.jsx', '.js', '.json'])
    
    for (const file of files) {
      totalFiles++
      const content = fs.readFileSync(file, 'utf8')
      
      // Buscar padrões problemáticos
      const matches = content.match(OLD_PATTERN)
      
      if (matches) {
        filesWithIssues++
        auditResults.codeFiles.push({
          file: path.relative(path.join(__dirname, '..'), file),
          matches: matches,
          lines: findLineNumbers(content, OLD_PATTERN)
        })
      }
    }
  }

  console.log(`   📊 Arquivos verificados: ${totalFiles}`)
  console.log(`   ${filesWithIssues === 0 ? '✅' : '⚠️'} Arquivos com problemas: ${filesWithIssues}`)
  
  if (filesWithIssues > 0) {
    console.log('\n   📋 Detalhes:')
    auditResults.codeFiles.forEach(item => {
      console.log(`      - ${item.file}`)
      console.log(`        Linhas: ${item.lines.join(', ')}`)
    })
  }
}

/**
 * 2. AUDITORIA DE BANCO DE DADOS
 */
async function auditDatabase(client) {
  console.log('\n🗄️  2. AUDITORIA DE BANCO DE DADOS\n')
  
  const tablesToCheck = [
    { table: 'companies', columns: ['metadata', 'settings'] },
    { table: 'users', columns: ['raw_user_meta_data', 'raw_app_meta_data'] },
    { table: 'gf_user_company_map', columns: ['metadata'] },
    { table: 'gf_notifications', columns: ['action_url', 'metadata'] },
    { table: 'gf_report_schedules', columns: ['report_config'] },
    { table: 'audit_logs', columns: ['details'] }
  ]

  for (const { table, columns } of tablesToCheck) {
    try {
      // Verificar se tabela existe
      const { rows: tableExists } = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        )
      `, [table])

      if (!tableExists[0].exists) {
        console.log(`   ⚠️ Tabela ${table} não existe`)
        continue
      }

      for (const column of columns) {
        // Verificar se coluna existe
        const { rows: columnExists } = await client.query(`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1 
            AND column_name = $2
          )
        `, [table, column])

        if (!columnExists[0].exists) {
          continue
        }

        // Buscar registros com padrão antigo
        const { rows } = await client.query(`
          SELECT id, ${column}
          FROM ${table}
          WHERE ${column}::text ~ 'operator\\?company='
          LIMIT 100
        `)

        if (rows.length > 0) {
          auditResults.databaseRecords.push({
            table,
            column,
            count: rows.length,
            samples: rows.slice(0, 3)
          })
          console.log(`   ⚠️ ${table}.${column}: ${rows.length} registros com padrão antigo`)
        }
      }
    } catch (error) {
      auditResults.warnings.push(`Erro ao verificar ${table}: ${error.message}`)
    }
  }

  console.log(`   ${auditResults.databaseRecords.length === 0 ? '✅' : '⚠️'} Tabelas com problemas: ${auditResults.databaseRecords.length}`)
}

/**
 * 3. VERIFICAÇÃO DE CONFIGURAÇÕES
 */
async function auditConfigFiles() {
  console.log('\n⚙️  3. AUDITORIA DE ARQUIVOS DE CONFIGURAÇÃO\n')
  
  const configFiles = [
    '.env.local',
    '.env.production',
    'vercel.json',
    'next.config.js',
    'package.json'
  ]

  let filesChecked = 0
  let filesWithIssues = 0

  for (const file of configFiles) {
    const filePath = path.join(__dirname, '..', file)
    
    if (!fs.existsSync(filePath)) continue
    
    filesChecked++
    const content = fs.readFileSync(filePath, 'utf8')
    const matches = content.match(OLD_PATTERN)
    
    if (matches) {
      filesWithIssues++
      auditResults.configFiles.push({
        file,
        matches: matches.length
      })
    }
  }

  console.log(`   📊 Arquivos verificados: ${filesChecked}`)
  console.log(`   ${filesWithIssues === 0 ? '✅' : '⚠️'} Arquivos com problemas: ${filesWithIssues}`)
}

/**
 * 4. CORREÇÃO AUTOMÁTICA DE BANCO DE DADOS
 */
async function fixDatabaseRecords(client) {
  if (auditResults.databaseRecords.length === 0) {
    console.log('\n✅ Nenhuma correção necessária no banco de dados')
    return
  }

  console.log('\n🔧 4. CORREÇÃO DE REGISTROS NO BANCO DE DADOS\n')

  for (const { table, column, count } of auditResults.databaseRecords) {
    try {
      const { rowCount } = await client.query(`
        UPDATE ${table}
        SET ${column} = regexp_replace(
          ${column}::text, 
          'operator\\?company=[a-f0-9-]+', 
          'operator', 
          'gi'
        )::jsonb
        WHERE ${column}::text ~ 'operator\\?company='
      `)

      auditResults.fixed.push({
        table,
        column,
        recordsUpdated: rowCount
      })

      console.log(`   ✅ ${table}.${column}: ${rowCount} registros corrigidos`)
    } catch (error) {
      console.error(`   ❌ Erro ao corrigir ${table}.${column}: ${error.message}`)
      auditResults.warnings.push(`Falha ao corrigir ${table}.${column}: ${error.message}`)
    }
  }
}

/**
 * 5. TESTES DE VERIFICAÇÃO
 */
async function runVerificationTests(client) {
  console.log('\n🧪 5. TESTES DE VERIFICAÇÃO\n')

  const tests = [
    {
      name: 'Links no banco sem parâmetros company',
      query: `
        SELECT COUNT(*) as count
        FROM gf_notifications
        WHERE action_url ~ 'operator\\?company='
      `,
      expectedCount: 0
    },
    {
      name: 'Empresa de teste configurada corretamente',
      query: `
        SELECT role 
        FROM companies 
        WHERE id = '${TEST_UUID}'
      `,
      expectedRole: 'operator'
    },
    {
      name: 'Funcionários cadastrados para empresa de teste',
      query: `
        SELECT COUNT(*) as count
        FROM gf_employee_company
        WHERE company_id = '${TEST_UUID}'
      `,
      minimumCount: 1
    }
  ]

  let passed = 0
  let failed = 0

  for (const test of tests) {
    try {
      const { rows } = await client.query(test.query)
      
      let testPassed = false
      
      if (test.expectedCount !== undefined) {
        testPassed = parseInt(rows[0].count) === test.expectedCount
      } else if (test.expectedRole) {
        testPassed = rows[0]?.role === test.expectedRole
      } else if (test.minimumCount !== undefined) {
        testPassed = parseInt(rows[0].count) >= test.minimumCount
      }

      if (testPassed) {
        passed++
        console.log(`   ✅ ${test.name}`)
      } else {
        failed++
        console.log(`   ❌ ${test.name}`)
        console.log(`      Resultado: ${JSON.stringify(rows[0])}`)
      }
    } catch (error) {
      failed++
      console.log(`   ❌ ${test.name}: ${error.message}`)
    }
  }

  console.log(`\n   📊 Testes: ${passed} passaram, ${failed} falharam`)
}

/**
 * FUNÇÕES AUXILIARES
 */
function getAllFiles(dir, extensions, fileList = []) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    
    if (fs.statSync(filePath).isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        getAllFiles(filePath, extensions, fileList)
      }
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        fileList.push(filePath)
      }
    }
  }
  
  return fileList
}

function findLineNumbers(content, pattern) {
  const lines = content.split('\n')
  const lineNumbers = []
  
  lines.forEach((line, index) => {
    if (line.match(pattern)) {
      lineNumbers.push(index + 1)
    }
  })
  
  return lineNumbers
}

/**
 * MAIN
 */
async function main() {
  console.log('=' .repeat(80))
  console.log('🔍 AUDITORIA E CORREÇÃO DE LINKS - SISTEMA GOLFFOX')
  console.log('=' .repeat(80))
  console.log(`\n⏰ Início: ${new Date().toLocaleString('pt-BR')}`)
  console.log(`📌 Link correto: ${CORRECT_LINK}`)
  console.log(`🔍 Padrão a buscar: operator?company=`)

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('✅ Conectado ao banco de dados')

    // Executar auditorias
    await auditCodeFiles()
    await auditDatabase(client)
    await auditConfigFiles()

    // Correções automáticas
    await fixDatabaseRecords(client)

    // Testes de verificação
    await runVerificationTests(client)

    // Relatório final
    console.log('\n' + '='.repeat(80))
    console.log('📊 RELATÓRIO FINAL')
    console.log('='.repeat(80))

    console.log(`\n✅ CÓDIGO:`)
    console.log(`   - Arquivos com problemas: ${auditResults.codeFiles.length}`)
    
    console.log(`\n✅ BANCO DE DADOS:`)
    console.log(`   - Tabelas com problemas: ${auditResults.databaseRecords.length}`)
    console.log(`   - Registros corrigidos: ${auditResults.fixed.reduce((sum, item) => sum + item.recordsUpdated, 0)}`)
    
    console.log(`\n✅ CONFIGURAÇÕES:`)
    console.log(`   - Arquivos com problemas: ${auditResults.configFiles.length}`)

    if (auditResults.warnings.length > 0) {
      console.log(`\n⚠️  AVISOS:`)
      auditResults.warnings.forEach(warning => {
        console.log(`   - ${warning}`)
      })
    }

    // Salvar relatório
    const reportPath = path.join(__dirname, 'AUDIT_REPORT.json')
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2))
    console.log(`\n💾 Relatório salvo em: ${reportPath}`)

    console.log('\n' + '='.repeat(80))
    console.log('✅ AUDITORIA CONCLUÍDA COM SUCESSO!')
    console.log('='.repeat(80))

  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    console.error(error.stack)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main().catch(console.error)

