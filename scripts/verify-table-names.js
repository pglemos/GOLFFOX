/**
 * Script para verificar se todas as tabelas estão com nomes PT-BR corretos
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

const EXPECTED_TABLES = [
  'transportadoras',
  'veiculos',
  'motorista_locations',
  'motorista_messages',
  'motorista_positions',
  'passageiro_checkins',
  'passageiro_cancellations',
  'trip_passageiros',
  'veiculo_checklists',
  'gf_veiculo_checklists',
  'gf_veiculo_documents',
  'gf_motorista_compensation',
  'gf_transportadora_documents',
  'gf_operador_settings',
  'gf_operador_incidents',
  'gf_operador_documents',
  'gf_operador_audits',
]

const OLD_TABLES = [
  'carriers',
  'vehicles',
  'drivers',
  'passengers',
  'operators',
  'driver_locations',
  'driver_messages',
  'driver_positions',
  'passenger_checkins',
  'passenger_cancellations',
  'trip_passengers',
  'vehicle_checklists',
  'gf_carriers',
  'gf_vehicles',
  'gf_drivers',
  'gf_passengers',
  'gf_operators',
  'gf_vehicle_checklists',
  'gf_vehicle_documents',
  'gf_driver_compensation',
  'gf_carrier_documents',
]

async function checkTable(client, tableName) {
  const query = `
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    ) as exists;
  `
  const result = await client.query(query, [tableName])
  return result.rows[0]?.exists || false
}

async function main() {
  console.log('🚀 Conectando ao banco de dados...')
  const client = new Client(DB_CONFIG)

  try {
    await client.connect()
    console.log('✅ Conectado com sucesso\n')

    console.log('='.repeat(70))
    console.log('✅ VERIFICANDO TABELAS PT-BR (Devem existir)')
    console.log('='.repeat(70) + '\n')

    let allCorrect = true
    for (const tableName of EXPECTED_TABLES) {
      const exists = await checkTable(client, tableName)
      const icon = exists ? '✅' : '❌'
      console.log(`${icon} ${tableName} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`)
      if (!exists) allCorrect = false
    }

    console.log('\n' + '='.repeat(70))
    console.log('❌ VERIFICANDO TABELAS ANTIGAS (NÃO devem existir)')
    console.log('='.repeat(70) + '\n')

    for (const tableName of OLD_TABLES) {
      const exists = await checkTable(client, tableName)
      const icon = exists ? '❌' : '✅'
      console.log(`${icon} ${tableName} - ${exists ? 'AINDA EXISTE (PROBLEMA!)' : 'NÃO EXISTE (OK)'}`)
      if (exists) allCorrect = false
    }

    console.log('\n' + '='.repeat(70))
    if (allCorrect) {
      console.log('✅ TODAS AS TABELAS ESTÃO CORRETAS!')
    } else {
      console.log('❌ ALGUMAS TABELAS PRECISAM SER CORRIGIDAS')
    }
    console.log('='.repeat(70))

  } catch (error) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Conexão encerrada')
  }
}

main()

