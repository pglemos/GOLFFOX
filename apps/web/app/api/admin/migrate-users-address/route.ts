import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

async function migrateUsersAddressHandler(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()

    // SQL para adicionar colunas de endereço na tabela users
    const migrationSQL = `
      -- Adicionar colunas de endereço na tabela users (se não existirem)
      DO $$ 
      BEGIN
        -- address_zip_code
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_zip_code') THEN
          ALTER TABLE users ADD COLUMN address_zip_code VARCHAR(10);
        END IF;
        
        -- address_street
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_street') THEN
          ALTER TABLE users ADD COLUMN address_street VARCHAR(255);
        END IF;
        
        -- address_number
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_number') THEN
          ALTER TABLE users ADD COLUMN address_number VARCHAR(20);
        END IF;
        
        -- address_neighborhood
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_neighborhood') THEN
          ALTER TABLE users ADD COLUMN address_neighborhood VARCHAR(100);
        END IF;
        
        -- address_complement
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_complement') THEN
          ALTER TABLE users ADD COLUMN address_complement VARCHAR(100);
        END IF;
        
        -- address_city
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_city') THEN
          ALTER TABLE users ADD COLUMN address_city VARCHAR(100);
        END IF;
        
        -- address_state
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address_state') THEN
          ALTER TABLE users ADD COLUMN address_state VARCHAR(2);
        END IF;
      END $$;
    `

    // Executar a migração usando rpc ou query direta
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // Se a função exec_sql não existir, tentar criar as colunas uma a uma
      logger.log('Tentando migração alternativa...')
      
      const columns = [
        { name: 'address_zip_code', type: 'VARCHAR(10)' },
        { name: 'address_street', type: 'VARCHAR(255)' },
        { name: 'address_number', type: 'VARCHAR(20)' },
        { name: 'address_neighborhood', type: 'VARCHAR(100)' },
        { name: 'address_complement', type: 'VARCHAR(100)' },
        { name: 'address_city', type: 'VARCHAR(100)' },
        { name: 'address_state', type: 'VARCHAR(2)' }
      ]

      const results = []
      
      for (const col of columns) {
        // Verificar se a coluna já existe tentando fazer um select
        const { error: checkError } = await supabaseAdmin
          .from('users')
          .select(col.name)
          .limit(1)
        
        if (checkError && checkError.message.includes('does not exist')) {
          results.push({ column: col.name, status: 'needs_creation', message: 'Coluna não existe - execute SQL no Supabase Dashboard' })
        } else if (!checkError) {
          results.push({ column: col.name, status: 'exists', message: 'Coluna já existe' })
        } else {
          results.push({ column: col.name, status: 'error', message: checkError.message })
        }
      }

      return NextResponse.json({
        success: false,
        message: 'Não foi possível executar a migração automaticamente. Execute o SQL abaixo no Supabase Dashboard:',
        sql: `
-- Execute este SQL no Supabase Dashboard (SQL Editor):

ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
        `.trim(),
        columnStatus: results
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Colunas de endereço adicionadas com sucesso!'
    })

  } catch (error: unknown) {
    logError('Erro na migração', { error }, 'MigrateUsersAddressAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({
      success: false,
      error: 'Erro ao executar migração',
      message: errorMessage,
      sql: `
-- Execute este SQL manualmente no Supabase Dashboard (SQL Editor):

ALTER TABLE users ADD COLUMN IF NOT EXISTS address_zip_code VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_street VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_neighborhood VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_complement VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(2);
      `.trim()
    }, { status: 500 })
  }
}

// Exportar com rate limiting (sensitive: 10 requests per minute)
export const POST = withRateLimit(migrateUsersAddressHandler, 'sensitive')

