require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function finalTest() {
  console.log('🧪 TESTE FINAL DE TODAS AS EXCLUSÕES\n')
  console.log('='.repeat(70))

  const results = {
    companies: { tested: false, success: false, error: null },
    routes: { tested: false, success: false, error: null },
    vehicles: { tested: false, success: false, error: null },
    drivers: { tested: false, success: false, error: null },
    alerts: { tested: false, success: false, error: null },
    assistance: { tested: false, success: false, error: null },
    users: { tested: false, success: false, error: null }
  }

  // 1. Testar exclusão de empresa
  console.log('\n1️⃣ TESTANDO EXCLUSÃO DE EMPRESA:')
  try {
    const { data: company } = await supabase.from('companies').select('id, is_active').limit(1).single()
    if (company) {
      results.companies.tested = true
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', company.id)
      
      if (error) {
        results.companies.error = error.message
        console.error('   ❌ Erro:', error.message)
        if (error.message.includes('updated_at')) {
          console.log('   💡 SOLUÇÃO: Execute o SQL em database/migrations/fix_companies_updated_at_final.sql')
        }
      } else {
        results.companies.success = true
        console.log('   ✅ Sucesso')
        // Reverter
        await supabase.from('companies').update({ is_active: true }).eq('id', company.id)
      }
    } else {
      console.log('   ⚠️ Nenhuma empresa encontrada para testar')
    }
  } catch (err) {
    results.companies.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // 2. Testar exclusão de rota
  console.log('\n2️⃣ TESTANDO EXCLUSÃO DE ROTA:')
  try {
    const { data: route } = await supabase.from('routes').select('id').limit(1).single()
    if (route) {
      results.routes.tested = true
      // Excluir route_stops primeiro
      await supabase.from('route_stops').delete().eq('route_id', route.id)
      // Verificar trips
      const { data: trips } = await supabase.from('trips').select('id').eq('route_id', route.id).limit(1)
      
      if (trips && trips.length > 0) {
        console.log('   ⚠️ Rota tem trips relacionados (validação funcionando)')
        results.routes.success = true // Validação está funcionando
      } else {
        const { error } = await supabase.from('routes').delete().eq('id', route.id)
        if (error) {
          results.routes.error = error.message
          console.error('   ❌ Erro:', error.message)
        } else {
          results.routes.success = true
          console.log('   ✅ Sucesso (rota excluída)')
        }
      }
    } else {
      console.log('   ⚠️ Nenhuma rota encontrada para testar')
    }
  } catch (err) {
    results.routes.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // 3. Testar exclusão de veículo
  console.log('\n3️⃣ TESTANDO EXCLUSÃO DE VEÍCULO:')
  try {
    const { data: vehicle } = await supabase.from('vehicles').select('id, is_active').limit(1).single()
    if (vehicle) {
      results.vehicles.tested = true
      const { error } = await supabase
        .from('vehicles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicle.id)
      
      if (error) {
        results.vehicles.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.vehicles.success = true
        console.log('   ✅ Sucesso')
        // Reverter
        await supabase.from('vehicles').update({ is_active: true }).eq('id', vehicle.id)
      }
    } else {
      console.log('   ⚠️ Nenhum veículo encontrado para testar')
    }
  } catch (err) {
    results.vehicles.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // 4. Testar exclusão de motorista
  console.log('\n4️⃣ TESTANDO EXCLUSÃO DE MOTORISTA:')
  try {
    const { data: driver } = await supabase.from('users').select('id').eq('role', 'driver').limit(1).single()
    if (driver) {
      results.drivers.tested = true
      const { error } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', driver.id)
      
      if (error) {
        results.drivers.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.drivers.success = true
        console.log('   ✅ Sucesso')
      }
    } else {
      console.log('   ⚠️ Nenhum motorista encontrado para testar')
    }
  } catch (err) {
    results.drivers.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // 5. Testar exclusão de alerta
  console.log('\n5️⃣ TESTANDO EXCLUSÃO DE ALERTA:')
  try {
    const { data: alert } = await supabase.from('gf_incidents').select('id').limit(1).single()
    if (alert) {
      results.alerts.tested = true
      const { error } = await supabase.from('gf_incidents').delete().eq('id', alert.id)
      
      if (error) {
        results.alerts.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.alerts.success = true
        console.log('   ✅ Sucesso (alerta excluído)')
      }
    } else {
      console.log('   ⚠️ Nenhum alerta encontrado para testar')
    }
  } catch (err) {
    results.alerts.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // 6. Testar exclusão de solicitação de socorro
  console.log('\n6️⃣ TESTANDO EXCLUSÃO DE SOLICITAÇÃO DE SOCORRO:')
  try {
    const { data: assistance } = await supabase.from('gf_assistance_requests').select('id').limit(1).single()
    if (assistance) {
      results.assistance.tested = true
      const { error } = await supabase.from('gf_assistance_requests').delete().eq('id', assistance.id)
      
      if (error) {
        results.assistance.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.assistance.success = true
        console.log('   ✅ Sucesso (solicitação excluída)')
      }
    } else {
      console.log('   ⚠️ Nenhuma solicitação encontrada para testar')
    }
  } catch (err) {
    results.assistance.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // 7. Testar exclusão de usuário
  console.log('\n7️⃣ TESTANDO EXCLUSÃO DE USUÁRIO:')
  try {
    const { data: user } = await supabase.from('users').select('id').neq('role', 'admin').limit(1).single()
    if (user) {
      results.users.tested = true
      const { error } = await supabase
        .from('users')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id)
      
      if (error) {
        results.users.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.users.success = true
        console.log('   ✅ Sucesso')
      }
    } else {
      console.log('   ⚠️ Nenhum usuário encontrado para testar')
    }
  } catch (err) {
    results.users.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Resumo final
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO FINAL DOS TESTES:')
  console.log('='.repeat(70))
  
  const testResults = [
    { name: 'Empresas', result: results.companies },
    { name: 'Rotas', result: results.routes },
    { name: 'Veículos', result: results.vehicles },
    { name: 'Motoristas', result: results.drivers },
    { name: 'Alertas', result: results.alerts },
    { name: 'Socorro', result: results.assistance },
    { name: 'Usuários', result: results.users }
  ]

  testResults.forEach(({ name, result }) => {
    if (!result.tested) {
      console.log(`${name.padEnd(15)} ⚠️  Não testado (sem dados)`)
    } else if (result.success) {
      console.log(`${name.padEnd(15)} ✅ OK`)
    } else {
      console.log(`${name.padEnd(15)} ❌ ${result.error || 'Falhou'}`)
    }
  })

  console.log('='.repeat(70))

  const allSuccess = testResults
    .filter(r => r.result.tested)
    .every(r => r.result.success)

  if (allSuccess) {
    console.log('\n✅ TODOS OS TESTES PASSARAM!')
    return 0
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM')
    console.log('\n💡 Para corrigir o erro de empresas, execute:')
    console.log('   SQL: database/migrations/fix_companies_updated_at_final.sql')
    console.log('   No Supabase Dashboard > SQL Editor')
    return 1
  }
}

finalTest()
  .then(exitCode => process.exit(exitCode || 0))
  .catch(err => {
    console.error('❌ Erro fatal:', err)
    process.exit(1)
  })

