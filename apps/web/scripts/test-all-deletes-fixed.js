require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDeleteVehicle() {
  console.log('\n🚗 TESTANDO EXCLUSÃO DE VEÍCULO:');
  
  // Criar veículo de teste
  const { data: vehicle, error: createError } = await supabase
    .from('vehicles')
    .insert({
      plate: `TEST-${Date.now()}`,
      model: 'Teste',
      is_active: true
    })
    .select()
    .single();
  
  if (createError || !vehicle) {
    console.error('   ❌ Erro ao criar veículo de teste:', createError?.message);
    return false;
  }
  
  console.log(`   ✅ Veículo criado: ${vehicle.plate}`);
  
  // Criar trip relacionado
  const { data: route } = await supabase.from('routes').select('id').limit(1).single();
  if (route) {
    await supabase.from('trips').insert({
      route_id: route.id,
      vehicle_id: vehicle.id,
      status: 'scheduled'
    });
    console.log('   ✅ Trip criado com vehicle_id');
  }
  
  // Testar exclusão via API
  try {
    const response = await fetch(`http://localhost:3000/api/admin/vehicles/delete?id=${vehicle.id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('   ✅ Exclusão bem-sucedida');
      return true;
    } else {
      console.error('   ❌ Erro na exclusão:', result.error);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro ao chamar API:', error.message);
    return false;
  }
}

async function testDeleteDriver() {
  console.log('\n👨‍✈️ TESTANDO EXCLUSÃO DE MOTORISTA:');
  
  // Buscar motorista existente
  const { data: driver } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'driver')
    .limit(1)
    .single();
  
  if (!driver) {
    console.log('   ⚠️ Nenhum motorista encontrado para testar');
    return true; // Não é erro, apenas não há dados
  }
  
  console.log(`   ✅ Motorista encontrado: ${driver.email}`);
  
  // Criar trip relacionado
  const { data: route } = await supabase.from('routes').select('id').limit(1).single();
  if (route) {
    await supabase.from('trips').insert({
      route_id: route.id,
      driver_id: driver.id,
      status: 'scheduled'
    });
    console.log('   ✅ Trip criado com driver_id');
  }
  
  // Testar exclusão via API
  try {
    const response = await fetch(`http://localhost:3000/api/admin/drivers/delete?id=${driver.id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('   ✅ Exclusão bem-sucedida');
      return true;
    } else {
      console.error('   ❌ Erro na exclusão:', result.error);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro ao chamar API:', error.message);
    return false;
  }
}

async function testDeleteRoute() {
  console.log('\n📋 TESTANDO EXCLUSÃO DE ROTA:');
  
  // Criar rota de teste
  const { data: company } = await supabase.from('companies').select('id').limit(1).single();
  if (!company) {
    console.log('   ⚠️ Nenhuma empresa encontrada para criar rota');
    return true;
  }
  
  // Buscar ou criar carrier
  let { data: carrier } = await supabase.from('carriers').select('id').limit(1).single();
  if (!carrier) {
    const { data: newCarrier } = await supabase
      .from('carriers')
      .insert({ name: 'Carrier Teste' })
      .select()
      .single();
    carrier = newCarrier;
  }
  
  const { data: route, error: createError } = await supabase
    .from('routes')
    .insert({
      name: `Rota Teste ${Date.now()}`,
      company_id: company.id,
      carrier_id: carrier?.id || '00000000-0000-0000-0000-000000000000'
    })
    .select()
    .single();
  
  if (createError || !route) {
    console.error('   ❌ Erro ao criar rota de teste:', createError?.message);
    return false;
  }
  
  console.log(`   ✅ Rota criada: ${route.name}`);
  
  // Criar trip relacionado
  await supabase.from('trips').insert({
    route_id: route.id,
    status: 'scheduled'
  });
  console.log('   ✅ Trip criado com route_id');
  
  // Testar exclusão via API
  try {
    const response = await fetch(`http://localhost:3000/api/admin/routes/delete?id=${route.id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('   ✅ Exclusão bem-sucedida');
      return true;
    } else {
      console.error('   ❌ Erro na exclusão:', result.error);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro ao chamar API:', error.message);
    return false;
  }
}

async function testDeleteCompany() {
  console.log('\n🏢 TESTANDO EXCLUSÃO DE EMPRESA:');
  
  // Criar empresa de teste
  const { data: company, error: createError } = await supabase
    .from('companies')
    .insert({
      name: `Empresa Teste ${Date.now()}`,
      is_active: true
    })
    .select()
    .single();
  
  if (createError || !company) {
    console.error('   ❌ Erro ao criar empresa de teste:', createError?.message);
    return false;
  }
  
  console.log(`   ✅ Empresa criada: ${company.name}`);
  
  // Testar exclusão via API
  try {
    const response = await fetch(`http://localhost:3000/api/admin/companies/delete?id=${company.id}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log('   ✅ Exclusão bem-sucedida');
      return true;
    } else {
      console.error('   ❌ Erro na exclusão:', result.error);
      return false;
    }
  } catch (error) {
    console.error('   ❌ Erro ao chamar API:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 TESTE COMPLETO DE TODAS AS EXCLUSÕES');
  console.log('========================================\n');
  
  const results = {
    vehicles: await testDeleteVehicle(),
    drivers: await testDeleteDriver(),
    routes: await testDeleteRoute(),
    companies: await testDeleteCompany(),
  };
  
  console.log('\n========================================');
  console.log('📊 RESUMO DOS TESTES:');
  console.log('========================================');
  console.log(`Veículos:    ${results.vehicles ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Motoristas:  ${results.drivers ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Rotas:       ${results.routes ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Empresas:    ${results.companies ? '✅ OK' : '❌ FALHOU'}`);
  console.log('========================================\n');
  
  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    process.exit(0);
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    process.exit(1);
  }
}

main();

