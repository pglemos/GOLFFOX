/**
 * Script de teste para verificar carregamento de veículos
 * Execute: node apps/web/test-vehicles-load.js
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vmoxzesvjcfmrebagcwo.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY não configurado')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testVehiclesLoad() {
  console.log('🔍 Testando carregamento de veículos...\n')

  // 1. Verificar veículos ativos
  console.log('1️⃣ Buscando veículos ativos...')
  const { data: veiculos, error: veiculosError } = await supabase
    .from('veiculos')
    .select('id, plate, model, is_active, company_id')
    .eq('is_active', true)
    .limit(10)

  if (veiculosError) {
    console.error('❌ Erro ao buscar veículos:', veiculosError)
    console.error('   Mensagem:', veiculosError.message)
    console.error('   Código:', veiculosError.code)
    console.error('   Detalhes:', veiculosError.details)
  } else {
    console.log(`✅ Encontrados ${veiculos?.length || 0} veículos ativos`)
    if (veiculos && veiculos.length > 0) {
      console.log('   Primeiros veículos:')
      veiculos.slice(0, 5).forEach(v => {
        console.log(`   - ${v.plate} (ID: ${v.id}, Company: ${v.company_id || 'N/A'})`)
      })
    } else {
      console.log('   ⚠️  Nenhum veículo ativo encontrado!')
    }
  }

  // 2. Verificar trips ativas
  console.log('\n2️⃣ Buscando trips ativas...')
  const { data: trips, error: tripsError } = await supabase
    .from('trips')
    .select('id, veiculo_id, status')
    .eq('status', 'inProgress')
    .limit(10)

  if (tripsError) {
    console.error('❌ Erro ao buscar trips:', tripsError)
  } else {
    console.log(`✅ Encontradas ${trips?.length || 0} trips ativas`)
  }

  // 3. Verificar posições recentes
  console.log('\n3️⃣ Buscando posições GPS recentes...')
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: positions, error: positionsError } = await supabase
    .from('motorista_positions')
    .select('trip_id, lat, lng, timestamp')
    .gte('timestamp', fiveMinutesAgo)
    .limit(10)

  if (positionsError) {
    console.error('❌ Erro ao buscar posições:', positionsError)
  } else {
    console.log(`✅ Encontradas ${positions?.length || 0} posições recentes`)
  }

  // 4. Resumo
  console.log('\n📊 RESUMO:')
  console.log(`   Veículos ativos: ${veiculos?.length || 0}`)
  console.log(`   Trips ativas: ${trips?.length || 0}`)
  console.log(`   Posições recentes: ${positions?.length || 0}`)
  
  if ((veiculos?.length || 0) === 0) {
    console.log('\n⚠️  PROBLEMA: Nenhum veículo ativo encontrado!')
    console.log('   Possíveis causas:')
    console.log('   - Não há veículos com is_active = true no banco')
    console.log('   - Problema com RLS (Row Level Security)')
    console.log('   - Problema com permissões do usuário')
  } else if ((trips?.length || 0) === 0) {
    console.log('\n⚠️  AVISO: Há veículos ativos, mas nenhuma trip ativa')
    console.log('   Os veículos devem aparecer mesmo sem trips ativas')
  }
}

testVehiclesLoad().catch(console.error)

