const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function countRecordsDetailed() {
  console.log('🔍 Contando registros no Supabase (detalhado)...\n')

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

    // Motoristas - verificar em users e drivers
    const { count: motoristasUsersCount, error: motoristasUsersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'driver')

    const { count: motoristasDriversCount, error: motoristasDriversError } = await supabase
      .from('drivers')
      .select('*', { count: 'exact', head: true })

    if (motoristasUsersError && motoristasDriversError) {
      console.error('❌ Erro ao contar motoristas:', motoristasUsersError.message)
    } else {
      const totalMotoristas = (motoristasUsersCount || 0) + (motoristasDriversCount || 0)
      console.log(`👨‍✈️ Motoristas:`)
      console.log(`   - Users com role='driver': ${motoristasUsersCount || 0}`)
      console.log(`   - Tabela drivers: ${motoristasDriversCount || 0}`)
      console.log(`   - Total: ${totalMotoristas}`)
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

    // Permissões - verificar várias tabelas possíveis
    console.log(`🔐 Permissões:`)
    const permissionTables = [
      'permissions',
      'user_permissions', 
      'gf_permissions',
      'gf_user_permissions',
      'role_permissions'
    ]
    
    let totalPermissoes = 0
    for (const table of permissionTables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (!error && count !== null) {
        console.log(`   - ${table}: ${count}`)
        totalPermissoes += count
      }
    }
    
    if (totalPermissoes === 0) {
      console.log(`   - Nenhuma tabela de permissões encontrada ou sem registros`)
    } else {
      console.log(`   - Total: ${totalPermissoes}`)
    }

    // Resumo
    console.log('\n' + '='.repeat(60))
    console.log('📊 RESUMO FINAL:')
    console.log('='.repeat(60))
    console.log(`📋 Rotas: ${rotasCount || 0}`)
    console.log(`🚗 Veículos: ${veiculosCount || 0}`)
    console.log(`👨‍✈️ Motoristas: ${(motoristasUsersCount || 0) + (motoristasDriversCount || 0)}`)
    console.log(`🏢 Empresas: ${empresasCount || 0}`)
    console.log(`🔐 Permissões: ${totalPermissoes}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Erro geral:', error)
    process.exit(1)
  }
}

countRecordsDetailed()

