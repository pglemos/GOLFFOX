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
}

async function getMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDir = join(process.cwd(), '..', 'database', 'migrations')
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  return files.map((file, index) => {
    const content = readFileSync(join(migrationsDir, file), 'utf-8')
    return {
      name: file,
      content,
      order: index,
    }
  })
}

async function executeMigration(migration: MigrationFile): Promise<boolean> {
  const client = await pool.connect()
  
  try {
    console.log(`\n📄 Executando: ${migration.name}`)
    
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
    
    await client.query('COMMIT')
    console.log(`  ✅ ${migration.name} executado com sucesso`)
    return true
  } catch (error: any) {
    await client.query('ROLLBACK')
    console.error(`  ❌ Erro em ${migration.name}:`, error.message)
    return false
  } finally {
    client.release()
  }
}

async function main() {
  console.log('🚀 Iniciando migrations GolfFox v41.0...\n')
  
  try {
    // Testar conexão
    const testResult = await pool.query('SELECT NOW()')
    console.log('✅ Conexão com banco estabelecida')
    console.log(`📍 Server time: ${testResult.rows[0].now}\n`)

    // Obter lista de migrations
    const migrations = await getMigrationFiles()
    console.log(`📦 Encontradas ${migrations.length} migrations:`)
    migrations.forEach((m, i) => console.log(`   ${i + 1}. ${m.name}`))

    // Executar migrations
    let successCount = 0
    let failCount = 0

    for (const migration of migrations) {
      const success = await executeMigration(migration)
      if (success) {
        successCount++
      } else {
        failCount++
        // Parar em caso de erro crítico?
        // break
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
    await pool.end()
  }
}

// Executar
main().catch(console.error)

