#!/usr/bin/env ts-node

/**
 * GolfFox Migration Script v41.0
 * Executa migrations SQL no Supabase/Postgres automaticamente
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load env vars
dotenv.config({ path: join(process.cwd(), '.env.local') })

const pool = new Pool({
  host: process.env.GF_DB_HOST || process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').replace('.supabase.co', ''),
  port: parseInt(process.env.GF_DB_PORT || '5432'),
  user: process.env.GF_DB_USER || 'postgres',
  password: process.env.GF_DB_PASSWORD,
  database: process.env.GF_DB_NAME || 'postgres',
  ssl: process.env.GF_DB_HOST ? { rejectUnauthorized: false } : undefined,
})

interface MigrationFile {
  name: string
  content: string
  order: number
  version: string // Timestamp ou número de versão
}

/**
 * Cria tabela schema_migrations se não existir
 */
async function ensureMigrationsTable(client: any): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    )
  `)
}

/**
 * Obtém lista de migrations já aplicadas
 */
async function getAppliedMigrations(client: any): Promise<Set<string>> {
  const result = await client.query('SELECT version FROM schema_migrations')
  return new Set(result.rows.map((row: any) => row.version))
}

/**
 * Registra migration como aplicada
 */
async function recordMigration(client: any, migration: MigrationFile): Promise<void> {
  await client.query(
    'INSERT INTO schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING',
    [migration.version, migration.name]
  )
}

async function getMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDir = join(process.cwd(), 'database', 'migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  return files.map((file, index) => {
    const content = readFileSync(join(migrationsDir, file), 'utf-8')
    // Extrair versão do nome do arquivo (formato: YYYYMMDD_HHMMSS_description.sql ou 001_description.sql)
    const versionMatch = file.match(/^(\d{8}_\d{6}|\d{3})_/)
    const version = versionMatch ? versionMatch[1] : file.replace('.sql', '')
    
    return {
      name: file,
      content,
      order: index,
      version,
    }
  })
}

async function executeMigration(migration: MigrationFile, client: any): Promise<boolean> {
  try {
    console.log(`\n📄 Executando: ${migration.name} (versão: ${migration.version})`)
    
    await client.query('BEGIN')
    
    // Separar statements (split por ';' mas manter dentro de blocos $$)
    const statements = migration.content
      .split(/;(?=(?:[^$]*\$\$[^$]*\$\$)*[^$]*$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement)
        } catch (err: any) {
          // Ignorar erros de "already exists" e "does not exist"
          if (err.message.includes('already exists') || err.message.includes('does not exist')) {
            console.log(`  ⚠️  Aviso (ignorado): ${err.message.split('\n')[0]}`)
          } else {
            throw err
          }
        }
      }
    }
    
    // Registrar migration como aplicada
    await recordMigration(client, migration)
    
    await client.query('COMMIT')
    console.log(`  ✅ ${migration.name} executado e registrado com sucesso`)
    return true
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error(`  ❌ Erro em ${migration.name}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Iniciando migrations GolfFox com controle de versão...\n')
  
  const client = await pool.connect()
  
  try {
    // Testar conexão
    const testResult = await client.query('SELECT NOW()')
    console.log('✅ Conexão com banco estabelecida')
    console.log(`📍 Server time: ${testResult.rows[0].now}\n`)

    // Criar tabela de controle de migrations
    await ensureMigrationsTable(client)
    console.log('✅ Tabela schema_migrations verificada/criada\n')

    // Obter migrations já aplicadas
    const appliedMigrations = await getAppliedMigrations(client)
    console.log(`📋 Migrations já aplicadas: ${appliedMigrations.size}`)
    if (appliedMigrations.size > 0) {
      appliedMigrations.forEach(version => console.log(`   - ${version}`))
    }
    console.log()

    // Obter lista de migrations disponíveis
    const migrations = await getMigrationFiles()
    console.log(`📦 Encontradas ${migrations.length} migrations disponíveis:`)
    migrations.forEach((m, i) => {
      const status = appliedMigrations.has(m.version) ? '✅ (já aplicada)' : '⏳ (pendente)'
      console.log(`   ${i + 1}. ${m.name} ${status}`)
    })
    console.log()

    // Filtrar migrations pendentes
    const pendingMigrations = migrations.filter(m => !appliedMigrations.has(m.version))
    
    if (pendingMigrations.length === 0) {
      console.log('✅ Todas as migrations já foram aplicadas!\n')
      return
    }

    console.log(`🔄 Aplicando ${pendingMigrations.length} migration(s) pendente(s)...\n`)

    // Executar migrations pendentes
    let successCount = 0
    let failCount = 0

    for (const migration of pendingMigrations) {
      const success = await executeMigration(migration, client)
      if (success) {
        successCount++
      } else {
        failCount++
        console.error(`\n⚠️  Parando execução devido a erro em ${migration.name}`)
        break
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`\n✅ Sucesso: ${successCount}`)
    if (failCount > 0) {
      console.log(`❌ Falhou: ${failCount}`)
    }
    console.log('\n✅ Migrations concluídas!\n')

  } catch (error: any) {
    console.error('\n❌ Erro fatal:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Executar
main().catch(console.error)

