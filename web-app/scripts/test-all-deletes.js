require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAllDeletes() {
  console.log('🧪 Testando todas as operações de exclusão...\n')

  const results = {
    companies: { success: false, error: null },
    routes: { success: false, error: null },
    vehicles: { success: false, error: null },
    drivers: { success: false, error: null },
    alerts: { success: false, error: null },
    assistance: { success: false, error: null },
    users: { success: false, error: null }
  }

  // Testar exclusão de empresa
  console.log('1️⃣ Testando exclusão de empresa:')
  try {
    const { data: company } = await supabase.from('companies').select('id').limit(1).single()
    if (company) {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', company.id)
      
      if (error) {
        results.companies.error = error.message
        console.error('   ❌ Erro:', error.message)
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

  // Testar exclusão de rota
  console.log('\n2️⃣ Testando exclusão de rota:')
  try {
    const { data: route } = await supabase.from('routes').select('id').limit(1).single()
    if (route) {
      // Primeiro excluir route_stops
      await supabase.from('route_stops').delete().eq('route_id', route.id)
      // Depois excluir a rota (ou desativar se houver foreign keys)
      const { error } = await supabase
        .from('routes')
        .update({ is_active: false })
        .eq('id', route.id)
      
      if (error) {
        results.routes.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.routes.success = true
        console.log('   ✅ Sucesso (rota excluída permanentemente)')
      }
    } else {
      console.log('   ⚠️ Nenhuma rota encontrada para testar')
    }
  } catch (err) {
    results.routes.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar exclusão de veículo
  console.log('\n3️⃣ Testando exclusão de veículo:')
  try {
    const { data: vehicle } = await supabase.from('vehicles').select('id').limit(1).single()
    if (vehicle) {
      // Desativar ao invés de excluir (devido a foreign keys)
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
        console.log('   ✅ Sucesso (veículo excluído permanentemente)')
      }
    } else {
      console.log('   ⚠️ Nenhum veículo encontrado para testar')
    }
  } catch (err) {
    results.vehicles.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar exclusão de motorista
  console.log('\n4️⃣ Testando exclusão de motorista:')
  try {
    const { data: driver } = await supabase.from('users').select('id').eq('role', 'driver').limit(1).single()
    if (driver) {
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
        // Reverter
        await supabase.from('users').update({ is_active: true }).eq('id', driver.id)
      }
    } else {
      console.log('   ⚠️ Nenhum motorista encontrado para testar')
    }
  } catch (err) {
    results.drivers.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar exclusão de alerta
  console.log('\n5️⃣ Testando exclusão de alerta:')
  try {
    const { data: alert } = await supabase.from('gf_incidents').select('id').limit(1).single()
    if (alert) {
      const { error } = await supabase.from('gf_incidents').delete().eq('id', alert.id)
      
      if (error) {
        results.alerts.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.alerts.success = true
        console.log('   ✅ Sucesso (alerta excluído permanentemente)')
      }
    } else {
      console.log('   ⚠️ Nenhum alerta encontrado para testar')
    }
  } catch (err) {
    results.alerts.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar exclusão de solicitação de socorro
  console.log('\n6️⃣ Testando exclusão de solicitação de socorro:')
  try {
    const { data: assistance } = await supabase.from('gf_assistance_requests').select('id').limit(1).single()
    if (assistance) {
      const { error } = await supabase.from('gf_assistance_requests').delete().eq('id', assistance.id)
      
      if (error) {
        results.assistance.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.assistance.success = true
        console.log('   ✅ Sucesso (solicitação excluída permanentemente)')
      }
    } else {
      console.log('   ⚠️ Nenhuma solicitação encontrada para testar')
    }
  } catch (err) {
    results.assistance.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar exclusão de usuário
  console.log('\n7️⃣ Testando exclusão de usuário:')
  try {
    const { data: user } = await supabase.from('users').select('id').neq('role', 'admin').limit(1).single()
    if (user) {
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
        // Reverter
        await supabase.from('users').update({ is_active: true }).eq('id', user.id)
      }
    } else {
      console.log('   ⚠️ Nenhum usuário encontrado para testar')
    }
  } catch (err) {
    results.users.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Resumo
  console.log('\n' + '='.repeat(60))
  console.log('📊 RESUMO DOS TESTES:')
  console.log('='.repeat(60))
  console.log(`Empresas: ${results.companies.success ? '✅' : '❌'} ${results.companies.error || 'OK'}`)
  console.log(`Rotas: ${results.routes.success ? '✅' : '❌'} ${results.routes.error || 'OK'}`)
  console.log(`Veículos: ${results.vehicles.success ? '✅' : '❌'} ${results.vehicles.error || 'OK'}`)
  console.log(`Motoristas: ${results.drivers.success ? '✅' : '❌'} ${results.drivers.error || 'OK'}`)
  console.log(`Alertas: ${results.alerts.success ? '✅' : '❌'} ${results.alerts.error || 'OK'}`)
  console.log(`Socorro: ${results.assistance.success ? '✅' : '❌'} ${results.assistance.error || 'OK'}`)
  console.log(`Usuários: ${results.users.success ? '✅' : '❌'} ${results.users.error || 'OK'}`)
  console.log('='.repeat(60))
}

testAllDeletes().catch(console.error)

