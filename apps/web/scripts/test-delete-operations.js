require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDeleteOperations() {
  console.log('🧪 Testando operações de exclusão...\n')

  // Testar estrutura da tabela companies
  console.log('📋 Verificando estrutura da tabela companies:')
  const { data: companySample, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .limit(1)

  if (companyError) {
    console.error('❌ Erro ao buscar empresa:', companyError)
  } else if (companySample && companySample.length > 0) {
    console.log('✅ Estrutura da empresa:', Object.keys(companySample[0]))
    console.log('   Campos:', JSON.stringify(companySample[0], null, 2))
  }

  // Testar update de is_active
  if (companySample && companySample.length > 0) {
    const testCompanyId = companySample[0].id
    console.log(`\n🔍 Testando update de is_active para empresa ${testCompanyId}:`)
    
    const { data: updateData, error: updateError } = await supabase
      .from('companies')
      .update({ is_active: false })
      .eq('id', testCompanyId)
      .select()

    if (updateError) {
      console.error('❌ Erro ao atualizar empresa:', updateError)
      console.error('   Código:', updateError.code)
      console.error('   Mensagem:', updateError.message)
      console.error('   Detalhes:', updateError.details)
      console.error('   Hint:', updateError.hint)
    } else {
      console.log('✅ Update realizado com sucesso:', updateData)
      
      // Reverter para não afetar os dados
      await supabase
        .from('companies')
        .update({ is_active: true })
        .eq('id', testCompanyId)
      console.log('   ✅ Revertido para is_active: true')
    }
  }

  // Testar outras tabelas
  console.log('\n📋 Verificando outras tabelas:')
  
  // Routes
  const { data: routeSample } = await supabase.from('routes').select('id').limit(1)
  if (routeSample && routeSample.length > 0) {
    console.log('✅ Tabela routes: OK')
  }

  // Vehicles
  const { data: vehicleSample } = await supabase.from('vehicles').select('id').limit(1)
  if (vehicleSample && vehicleSample.length > 0) {
    console.log('✅ Tabela vehicles: OK')
  }

  // Users (drivers)
  const { data: driverSample } = await supabase.from('users').select('id').eq('role', 'driver').limit(1)
  if (driverSample && driverSample.length > 0) {
    console.log('✅ Tabela users (drivers): OK')
  }

  // Alerts
  const { data: alertSample } = await supabase.from('gf_incidents').select('id').limit(1)
  if (alertSample && alertSample.length > 0) {
    console.log('✅ Tabela gf_incidents: OK')
  }

  // Assistance requests
  const { data: assistanceSample } = await supabase.from('gf_assistance_requests').select('id').limit(1)
  if (assistanceSample && assistanceSample.length > 0) {
    console.log('✅ Tabela gf_assistance_requests: OK')
  }

  console.log('\n✅ Testes concluídos')
}

testDeleteOperations().catch(console.error)

