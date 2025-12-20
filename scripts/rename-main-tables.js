/**
 * Script para renomear tabelas principais do Supabase
 * carriers → transportadoras
 * vehicles → veiculos
 */

const { Client } = require('pg')

const DB_CONFIG = {
  host: 'aws-1-sa-east-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.vmoxzesvjcfmrebagcwo',
  password: 'Guigui1309@',
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000
}

const TABLES_TO_RENAME = [
  ['carriers', 'transportadoras'],
  ['vehicles', 'veiculos'],
  ['gf_carriers', 'gf_transportadoras'],
  ['gf_vehicles', 'gf_veiculos'],
]

async function renameTable(client, oldName, newName) {
  try {
    // Verificar se a tabela existe
    const checkQuery = `
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      ) as exists;
    `
    
    const checkResult = await client.query(checkQuery, [oldName])
    const exists = checkResult.rows[0]?.exists

    if (!exists) {
      console.log(`   ⚠️  ${oldName} não existe, pulando...`)
      return false
    }

    // Verificar se a nova tabela já existe
    const checkNewResult = await client.query(checkQuery, [newName])
    const newExists = checkNewResult.rows[0]?.exists

    if (newExists) {
      console.log(`   ⚠️  ${newName} já existe, pulando renomeação de ${oldName}...`)
      return false
    }

    // Renomear tabela
    const renameQuery = `ALTER TABLE IF EXISTS public.${oldName} RENAME TO ${newName};`
    await client.query(renameQuery)
    
    console.log(`   ✅ ${oldName} → ${newName}`)
    return true
  } catch (error) {
    console.error(`   ❌ Erro ao renomear ${oldName} → ${newName}:`, error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Conectando ao banco de dados...')
  const client = new Client(DB_CONFIG)

  try {
    await client.connect()
    console.log('✅ Conectado com sucesso\n')

    console.log('='.repeat(60))
    console.log('📋 RENOMEANDO TABELAS PRINCIPAIS')
    console.log('='.repeat(60) + '\n')

    let renamed = 0
    for (const [oldName, newName] of TABLES_TO_RENAME) {
      const success = await renameTable(client, oldName, newName)
      if (success) renamed++
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Renomeação concluída: ${renamed} tabela(s) renomeada(s)`)
    console.log('='.repeat(60))

    // Verificar resultado
    console.log('\n🔍 Verificando tabelas renomeadas...\n')
    for (const [, newName] of TABLES_TO_RENAME) {
      const checkQuery = `
        SELECT EXISTS (
          SELECT 1 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists;
      `
      const result = await client.query(checkQuery, [newName])
      const exists = result.rows[0]?.exists
      console.log(`   ${exists ? '✅' : '❌'} ${newName} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Conexão encerrada')
  }
}

main()

