#!/usr/bin/env node
/**
 * Script para criar categorias de custo essenciais
 * Executa via Supabase Service Role
 */

// Tentar carregar dotenv
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  // dotenv não instalado, tentar sem
  console.log('⚠️ dotenv não disponível, usando variáveis de ambiente do sistema')
}

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const categories = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    name: 'Combustível',
    description: 'Gastos com combustível (gasolina, diesel, etanol)',
    is_active: true
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Manutenção',
    description: 'Manutenção preventiva e corretiva de veículos',
    is_active: true
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    name: 'Pessoal',
    description: 'Salários, benefícios e encargos de motoristas e operadores',
    is_active: true
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    name: 'Seguros',
    description: 'Seguro de veículos, responsabilidade civil e outros',
    is_active: true
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    name: 'Licenciamento',
    description: 'IPVA, licenciamento, taxas e impostos sobre veículos',
    is_active: true
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    name: 'Pneus',
    description: 'Compra e manutenção de pneus',
    is_active: true
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    name: 'Lavagem e Limpeza',
    description: 'Lavagem e limpeza interna/externa dos veículos',
    is_active: true
  },
  {
    id: 'c8888888-8888-8888-8888-888888888888',
    name: 'Depreciação',
    description: 'Depreciação de veículos e equipamentos',
    is_active: true
  },
  {
    id: 'c9999999-9999-9999-9999-999999999999',
    name: 'Outros',
    description: 'Custos diversos não categorizados',
    is_active: true
  }
]

async function seedCostCategories() {
  console.log('🌱 Iniciando seed de categorias de custo...')
  
  try {
    // Verificar se a tabela existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('gf_cost_categories')
      .select('id')
      .limit(1)
    
    if (tableError) {
      if (tableError.message.includes('does not exist')) {
        console.error('❌ Tabela gf_cost_categories não existe')
        console.error('Execute as migrations primeiro!')
        process.exit(1)
      }
      console.warn('⚠️ Aviso ao verificar tabela:', tableError.message)
    }
    
    // Tentar inserir cada categoria
    let inserted = 0
    let updated = 0
    let errors = 0
    
    for (const category of categories) {
      // Verificar se categoria já existe
      const { data: existing, error: checkError } = await supabase
        .from('gf_cost_categories')
        .select('id')
        .eq('id', category.id)
        .maybeSingle()
      
      if (checkError) {
        console.error(`❌ Erro ao verificar categoria ${category.name}:`, checkError.message)
        errors++
        continue
      }
      
      if (existing) {
        // Atualizar categoria existente
        const { error: updateError } = await supabase
          .from('gf_cost_categories')
          .update({
            name: category.name,
            description: category.description,
            is_active: category.is_active
          })
          .eq('id', category.id)
        
        if (updateError) {
          console.error(`❌ Erro ao atualizar categoria ${category.name}:`, updateError.message)
          errors++
        } else {
          console.log(`✅ Categoria atualizada: ${category.name}`)
          updated++
        }
      } else {
        // Inserir nova categoria
        const { error: insertError } = await supabase
          .from('gf_cost_categories')
          .insert(category)
        
        if (insertError) {
          console.error(`❌ Erro ao inserir categoria ${category.name}:`, insertError.message)
          errors++
        } else {
          console.log(`✅ Categoria criada: ${category.name}`)
          inserted++
        }
      }
    }
    
    console.log('\n📊 Resultado do seed:')
    console.log(`   • Categorias criadas: ${inserted}`)
    console.log(`   • Categorias atualizadas: ${updated}`)
    console.log(`   • Erros: ${errors}`)
    console.log(`   • Total: ${categories.length}`)
    
    // Verificar total de categorias ativas
    const { count, error: countError } = await supabase
      .from('gf_cost_categories')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (!countError) {
      console.log(`\n✅ Total de categorias ativas no banco: ${count}`)
    }
    
    if (errors > 0) {
      console.log('\n⚠️ Seed concluído com erros')
      process.exit(1)
    } else {
      console.log('\n✅ Seed concluído com sucesso!')
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Erro inesperado:', error)
    process.exit(1)
  }
}

seedCostCategories()

