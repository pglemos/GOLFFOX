#!/usr/bin/env node
/**
 * Script para criar empresa de teste
 * Executa via Supabase Service Role
 */

// Tentar carregar dotenv
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('⚠️ dotenv não disponível, usando variáveis de ambiente do sistema')
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testCompany = {
  name: 'Empresa Teste GolfFox',
  cnpj: '12.345.678/0001-90',
  address: 'Rua Teste, 123 - São Paulo, SP',
  phone: '(11) 99999-9999',
  email: 'teste@golffox.com',
  is_active: true
}

async function seedCompany() {
  console.log('🌱 Iniciando seed de empresa de teste...')
  
  try {
    // Verificar se a tabela existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('companies')
      .select('id')
      .limit(1)
    
    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.error('❌ Tabela companies não existe')
        console.error('Execute as migrations primeiro!')
        process.exit(1)
      }
      console.warn('⚠️ Aviso ao verificar tabela:', tableError.message)
    }
    
    // Verificar se empresa já existe (por nome ou CNPJ)
    const { data: existingByName } = await supabase
      .from('companies')
      .select('*')
      .eq('name', testCompany.name)
      .maybeSingle()
    
    const { data: existingByCnpj } = await supabase
      .from('companies')
      .select('*')
      .eq('cnpj', testCompany.cnpj)
      .maybeSingle()
    
    if (existingByName || existingByCnpj) {
      const existing = existingByName || existingByCnpj
      console.log('✅ Empresa de teste já existe:')
      console.log(`   ID: ${existing.id}`)
      console.log(`   Nome: ${existing.name}`)
      console.log(`   CNPJ: ${existing.cnpj || '(não informado)'}`)
      console.log(`   Ativa: ${existing.is_active ? 'Sim' : 'Não'}`)
      console.log(`\n📋 Use este company_id nos testes: ${existing.id}`)
      process.exit(0)
    }
    
    // Criar empresa
    const { data: newCompany, error: createError } = await supabase
      .from('companies')
      .insert(testCompany)
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Erro ao criar empresa:', createError.message)
      process.exit(1)
    }
    
    console.log('✅ Empresa de teste criada com sucesso:')
    console.log(`   ID: ${newCompany.id}`)
    console.log(`   Nome: ${newCompany.name}`)
    console.log(`   CNPJ: ${newCompany.cnpj}`)
    console.log(`   Email: ${newCompany.email}`)
    console.log(`   Ativa: ${newCompany.is_active ? 'Sim' : 'Não'}`)
    console.log(`\n📋 Use este company_id nos testes: ${newCompany.id}`)
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

seedCompany()

