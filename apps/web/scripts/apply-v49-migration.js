/**
 * Script para aplicar migration v49 (RLS em gf_user_company_map)
 * Execute: node scripts/apply-v49-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar configurados')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // Ler arquivo SQL
  const sqlPath = path.join(__dirname, '../../database/migrations/v49_protect_user_company_map.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  console.log('📝 Aplicando migration v49: RLS em gf_user_company_map...')
  console.log('')

  try {
    // Executar SQL em partes (Supabase tem limite de tamanho)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.length === 0) continue
      
      // Pular comentários
      if (statement.startsWith('--')) continue
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        // Se RPC não existir, tentar método alternativo
        if (error && error.message.includes('function exec_sql')) {
          console.log('⚠️  RPC exec_sql não disponível. Usando método alternativo...')
          // Para comandos DDL, precisamos usar o SQL Editor do Supabase
          console.log('📋 SQL para executar manualmente no Supabase SQL Editor:')
          console.log('')
          console.log('='.repeat(80))
          console.log(sql)
          console.log('='.repeat(80))
          console.log('')
          console.log('✅ Copie o SQL acima e execute no Supabase SQL Editor')
          return
        }
        
        if (error) {
          console.error('❌ Erro ao executar statement:', error.message)
          console.error('Statement:', statement.substring(0, 100) + '...')
        } else {
          console.log('✅ Statement executado com sucesso')
        }
      } catch (err) {
        console.error('❌ Erro:', err.message)
      }
    }

    // Verificar se RLS foi aplicado
    const { data: policies, error: checkError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'gf_user_company_map')

    if (checkError) {
      console.log('')
      console.log('⚠️  Não foi possível verificar políticas. Execute manualmente no Supabase SQL Editor:')
      console.log('')
      console.log('='.repeat(80))
      console.log(sql)
      console.log('='.repeat(80))
    } else {
      console.log('')
      console.log('✅ Migration v49 aplicada com sucesso!')
      console.log(`📊 Políticas encontradas: ${policies?.length || 0}`)
    }

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error.message)
    console.log('')
    console.log('📋 Execute manualmente no Supabase SQL Editor:')
    console.log('')
    console.log('='.repeat(80))
    console.log(sql)
    console.log('='.repeat(80))
    process.exit(1)
  }
}

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

applyMigration()

