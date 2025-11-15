const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

// Cliente com anon key (como no frontend)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

// Cliente com service role (bypass RLS)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

async function testQueries() {
  console.log('🔍 Testando queries de Rotas e Veículos...\n')

  // Testar Rotas com anon key
  console.log('📋 TESTANDO ROTAS (com anon key - como no frontend):')
  const { data: rotasAnon, error: rotasAnonError } = await supabaseAnon
    .from('routes')
    .select('*, companies(name)')
    .limit(5)

  if (rotasAnonError) {
    console.error('❌ Erro ao buscar rotas (anon):', rotasAnonError.message)
    console.error('   Código:', rotasAnonError.code)
  } else {
    console.log(`✅ Rotas encontradas (anon): ${rotasAnon?.length || 0}`)
    if (rotasAnon && rotasAnon.length > 0) {
      console.log('   Primeira rota:', rotasAnon[0].name)
    }
  }

  // Testar Rotas com service role
  console.log('\n📋 TESTANDO ROTAS (com service role - bypass RLS):')
  const { data: rotasService, error: rotasServiceError } = await supabaseService
    .from('routes')
    .select('*, companies(name)')
    .limit(5)

  if (rotasServiceError) {
    console.error('❌ Erro ao buscar rotas (service):', rotasServiceError.message)
  } else {
    console.log(`✅ Rotas encontradas (service): ${rotasService?.length || 0}`)
    if (rotasService && rotasService.length > 0) {
      console.log('   Primeira rota:', rotasService[0].name)
    }
  }

  // Testar Veículos com anon key
  console.log('\n🚗 TESTANDO VEÍCULOS (com anon key - como no frontend):')
  const { data: veiculosAnon, error: veiculosAnonError } = await supabaseAnon
    .from('vehicles')
    .select('*, companies(id, name)')
    .limit(5)

  if (veiculosAnonError) {
    console.error('❌ Erro ao buscar veículos (anon):', veiculosAnonError.message)
    console.error('   Código:', veiculosAnonError.code)
  } else {
    console.log(`✅ Veículos encontrados (anon): ${veiculosAnon?.length || 0}`)
    if (veiculosAnon && veiculosAnon.length > 0) {
      console.log('   Primeiro veículo:', veiculosAnon[0].plate || veiculosAnon[0].id)
    }
  }

  // Testar Veículos com service role
  console.log('\n🚗 TESTANDO VEÍCULOS (com service role - bypass RLS):')
  const { data: veiculosService, error: veiculosServiceError } = await supabaseService
    .from('vehicles')
    .select('*, companies(id, name)')
    .limit(5)

  if (veiculosServiceError) {
    console.error('❌ Erro ao buscar veículos (service):', veiculosServiceError.message)
  } else {
    console.log(`✅ Veículos encontrados (service): ${veiculosService?.length || 0}`)
    if (veiculosService && veiculosService.length > 0) {
      console.log('   Primeiro veículo:', veiculosService[0].plate || veiculosService[0].id)
    }
  }

  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO:')
  console.log('='.repeat(60))
  console.log(`Rotas (anon): ${rotasAnon?.length || 0} | Rotas (service): ${rotasService?.length || 0}`)
  console.log(`Veículos (anon): ${veiculosAnon?.length || 0} | Veículos (service): ${veiculosService?.length || 0}`)
  
  if ((rotasAnon?.length || 0) === 0 && (rotasService?.length || 0) > 0) {
    console.log('\n⚠️  PROBLEMA DETECTADO: Rotas bloqueadas por RLS!')
  }
  
  if ((veiculosAnon?.length || 0) === 0 && (veiculosService?.length || 0) > 0) {
    console.log('\n⚠️  PROBLEMA DETECTADO: Veículos bloqueados por RLS!')
  }
  
  console.log('='.repeat(60))
}

testQueries()

