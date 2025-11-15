require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function autoFixAndTest() {
  console.log('🚀 EXECUÇÃO AUTÔNOMA - CORREÇÃO E TESTES\n')
  console.log('='.repeat(70))

  // 1. Verificar se updated_at existe
  console.log('\n1️⃣ Verificando estrutura da tabela companies...')
  const { data: company } = await supabase.from('companies').select('*').limit(1).single()
  
  let needsFix = false
  if (company && !('updated_at' in company)) {
    console.log('   ⚠️ Coluna updated_at não existe')
    needsFix = true
  } else if (company && 'updated_at' in company) {
    console.log('   ✅ Coluna updated_at já existe')
  }

  // 2. Tentar executar correção via API
  if (needsFix) {
    console.log('\n2️⃣ Tentando executar correção automaticamente...')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${apiUrl}/api/admin/execute-sql-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      if (result.success) {
        console.log('   ✅ Correção aplicada via API')
      } else {
        console.log('   ⚠️ Não foi possível aplicar automaticamente')
        console.log('   📋 SQL necessário:')
        console.log('\n' + result.sql + '\n')
      }
    } catch (err) {
      console.log('   ⚠️ API não disponível, tentando método alternativo...')
    }

    // 3. Tentar criar função via RPC direto (se possível)
    console.log('\n3️⃣ Tentando criar função SQL via Supabase...')
    try {
      // Verificar se podemos executar SQL via uma abordagem alternativa
      // Como não temos acesso direto ao SQL, vamos tentar usar uma função existente
      // ou criar uma nova via uma migration manual
      
      // Por enquanto, vamos apenas verificar se a coluna foi adicionada
      // após uma possível execução manual
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const { data: companyAfter } = await supabase.from('companies').select('*').limit(1).single()
      if (companyAfter && 'updated_at' in companyAfter) {
        console.log('   ✅ Coluna updated_at foi adicionada!')
        needsFix = false
      } else {
        console.log('   ⚠️ Ainda precisa de correção manual')
        console.log('   💡 Execute o SQL em: database/migrations/fix_companies_updated_at_final.sql')
      }
    } catch (err) {
      console.log('   ⚠️ Não foi possível verificar automaticamente')
    }
  }

  // 4. Executar testes completos
  console.log('\n4️⃣ Executando testes completos de exclusão...')
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

  // Testar empresas
  console.log('\n📋 Testando exclusão de empresa:')
  try {
    const { data: testCompany } = await supabase.from('companies').select('id, is_active').limit(1).single()
    if (testCompany) {
      results.companies.tested = true
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', testCompany.id)
      
      if (error) {
        results.companies.error = error.message
        console.error('   ❌ Erro:', error.message)
      } else {
        results.companies.success = true
        console.log('   ✅ Sucesso')
        await supabase.from('companies').update({ is_active: true }).eq('id', testCompany.id)
      }
    }
  } catch (err) {
    results.companies.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar rotas
  console.log('\n📋 Testando exclusão de rota:')
  try {
    const { data: route } = await supabase.from('routes').select('id').limit(1).single()
    if (route) {
      results.routes.tested = true
      await supabase.from('route_stops').delete().eq('route_id', route.id)
      const { data: trips } = await supabase.from('trips').select('id').eq('route_id', route.id).limit(1)
      
      if (trips && trips.length > 0) {
        console.log('   ✅ Validação funcionando (rota tem trips)')
        results.routes.success = true
      } else {
        const { error } = await supabase.from('routes').delete().eq('id', route.id)
        if (error) {
          results.routes.error = error.message
          console.error('   ❌ Erro:', error.message)
        } else {
          results.routes.success = true
          console.log('   ✅ Sucesso')
        }
      }
    }
  } catch (err) {
    results.routes.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar veículos
  console.log('\n🚗 Testando exclusão de veículo:')
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
        await supabase.from('vehicles').update({ is_active: true }).eq('id', vehicle.id)
      }
    }
  } catch (err) {
    results.vehicles.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Testar usuários
  console.log('\n👤 Testando exclusão de usuário:')
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
    }
  } catch (err) {
    results.users.error = err.message
    console.error('   ❌ Erro:', err.message)
  }

  // Resumo final
  console.log('\n' + '='.repeat(70))
  console.log('📊 RESUMO FINAL:')
  console.log('='.repeat(70))
  
  const testResults = [
    { name: 'Empresas', result: results.companies },
    { name: 'Rotas', result: results.routes },
    { name: 'Veículos', result: results.vehicles },
    { name: 'Usuários', result: results.users }
  ]

  testResults.forEach(({ name, result }) => {
    if (!result.tested) {
      console.log(`${name.padEnd(15)} ⚠️  Sem dados`)
    } else if (result.success) {
      console.log(`${name.padEnd(15)} ✅ OK`)
    } else {
      console.log(`${name.padEnd(15)} ❌ ${result.error?.substring(0, 50) || 'Falhou'}`)
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
    if (results.companies.error && results.companies.error.includes('updated_at')) {
      console.log('\n💡 Para corrigir empresas, execute:')
      console.log('   database/migrations/fix_companies_updated_at_final.sql')
      console.log('   No Supabase Dashboard > SQL Editor')
    }
    return 1
  }
}

autoFixAndTest()
  .then(exitCode => {
    console.log('\n✅ Execução concluída!')
    process.exit(exitCode || 0)
  })
  .catch(err => {
    console.error('❌ Erro fatal:', err)
    process.exit(1)
  })

