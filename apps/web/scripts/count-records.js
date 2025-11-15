const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function countRecords() {
  console.log('🔍 Contando registros no Supabase...\n')

  try {
    // Rotas
    const { count: rotasCount, error: rotasError } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })

    if (rotasError) {
      console.error('❌ Erro ao contar rotas:', rotasError.message)
    } else {
      console.log(`📋 Rotas: ${rotasCount || 0}`)
    }

    // Veículos
    const { count: veiculosCount, error: veiculosError } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })

    if (veiculosError) {
      console.error('❌ Erro ao contar veículos:', veiculosError.message)
    } else {
      console.log(`🚗 Veículos: ${veiculosCount || 0}`)
    }

    // Motoristas (users com role = 'driver')
    const { count: motoristasCount, error: motoristasError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'driver')

    if (motoristasError) {
      console.error('❌ Erro ao contar motoristas:', motoristasError.message)
    } else {
      console.log(`👨‍✈️ Motoristas: ${motoristasCount || 0}`)
    }

    // Empresas
    const { count: empresasCount, error: empresasError } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    if (empresasError) {
      console.error('❌ Erro ao contar empresas:', empresasError.message)
    } else {
      console.log(`🏢 Empresas: ${empresasCount || 0}`)
    }

    // Permissões (verificar tabela de permissões)
    // Pode ser 'permissions', 'user_permissions', 'gf_permissions', etc.
    const permissionTables = ['permissions', 'user_permissions', 'gf_permissions', 'gf_user_permissions']
    let permissoesCount = 0
    let permissoesError = null

    for (const table of permissionTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (!error && count !== null) {
        permissoesCount = count
        break
      } else if (error && error.code !== 'PGRST116') {
        // PGRST116 = tabela não existe, continuar tentando
        permissoesError = error
      }
    }

    if (permissoesError && permissoesCount === 0) {
      console.error('❌ Erro ao contar permissões:', permissoesError.message)
      console.log(`🔐 Permissões: Tabela não encontrada ou sem registros`)
    } else {
      console.log(`🔐 Permissões: ${permissoesCount || 0}`)
    }

    // Resumo
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESUMO:')
    console.log('='.repeat(50))
    console.log(`📋 Rotas: ${rotasCount || 0}`)
    console.log(`🚗 Veículos: ${veiculosCount || 0}`)
    console.log(`👨‍✈️ Motoristas: ${motoristasCount || 0}`)
    console.log(`🏢 Empresas: ${empresasCount || 0}`)
    console.log(`🔐 Permissões: ${permissoesCount || 0}`)
    console.log('='.repeat(50))

  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

countRecords()

