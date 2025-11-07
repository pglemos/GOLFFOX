/**
 * Script para aplicar migration v49 diretamente no Supabase via PostgreSQL
 * Execute: node scripts/apply-v49-direct.js
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
  // Usar DATABASE_URL fornecida ou variável de ambiente
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres'
  
  if (!databaseUrl) {
    console.error('❌ Erro: DATABASE_URL não configurada')
    process.exit(1)
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Supabase requer SSL
    }
  })

  // Ler arquivo SQL
  const sqlPath = path.join(__dirname, '../../database/migrations/v49_protect_user_company_map.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  console.log('📝 Aplicando migration v49: RLS em gf_user_company_map...')
  console.log('🔗 Conectando ao Supabase...')
  console.log('')

  try {
    await client.connect()
    console.log('✅ Conectado ao banco de dados')
    console.log('')

    // Executar SQL completo
    console.log('🚀 Executando migration...')
    await client.query(sql)
    
    console.log('✅ Migration v49 aplicada com sucesso!')
    console.log('')

    // Verificar se RLS foi aplicado
    console.log('🔍 Verificando políticas criadas...')
    const policiesResult = await client.query(`
      SELECT 
        policyname,
        cmd,
        roles
      FROM pg_policies
      WHERE tablename = 'gf_user_company_map'
      ORDER BY policyname;
    `)

    if (policiesResult.rows.length > 0) {
      console.log('')
      console.log('📊 Políticas encontradas:')
      policiesResult.rows.forEach(policy => {
        console.log(`   - ${policy.policyname} (${policy.cmd})`)
      })
    } else {
      console.log('⚠️  Nenhuma política encontrada (pode ser normal se já existiam)')
    }

    // Verificar se RLS está habilitado
    const rlsResult = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename = 'gf_user_company_map' AND schemaname = 'public';
    `)

    if (rlsResult.rows.length > 0) {
      const rlsEnabled = rlsResult.rows[0].rowsecurity
      console.log('')
      console.log(`🔒 RLS habilitado: ${rlsEnabled ? '✅ SIM' : '❌ NÃO'}`)
    }

    console.log('')
    console.log('✅ Migration aplicada e verificada com sucesso!')
    console.log('')

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message)
    console.error('')
    console.error('Detalhes:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Conexão fechada')
  }
}

// Executar
applyMigration().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})

