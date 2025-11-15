require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDeleteWithTrips(entityType, entityId, apiEndpoint) {
  console.log(`\n🧪 Testando exclusão de ${entityType} com trips relacionados:`);
  
  // Criar trip relacionado
  const { data: route } = await supabase.from('routes').select('id').limit(1).single();
  if (!route) {
    console.log('   ⚠️ Nenhuma rota encontrada, pulando teste de trip');
    return true;
  }
  
  let tripData = { route_id: route.id, status: 'scheduled' };
  
  if (entityType === 'veículo') {
    tripData.vehicle_id = entityId;
  } else if (entityType === 'motorista') {
    tripData.driver_id = entityId;
  }
  
  const { data: trip } = await supabase
    .from('trips')
    .insert(tripData)
    .select()
    .single();
  
  if (trip) {
    console.log(`   ✅ Trip criado com ${entityType === 'veículo' ? 'vehicle_id' : 'driver_id'}`);
  }
  
  // Testar exclusão
  try {
    const response = await fetch(`http://localhost:3000${apiEndpoint}?id=${entityId}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (result.success) {
      console.log(`   ✅ Exclusão de ${entityType} bem-sucedida`);
      
      // Verificar se trip foi atualizado corretamente
      const { data: updatedTrip } = await supabase
        .from('trips')
        .select('*')
        .eq('id', trip.id)
        .single();
      
      if (updatedTrip) {
        if (entityType === 'veículo' && updatedTrip.vehicle_id === null) {
          console.log('   ✅ Trip.vehicle_id setado para NULL corretamente');
        } else if (entityType === 'motorista' && updatedTrip.driver_id === null) {
          console.log('   ✅ Trip.driver_id setado para NULL corretamente');
        }
      }
      
      return true;
    } else {
      console.error(`   ❌ Erro na exclusão:`, result.error);
      return false;
    }
  } catch (error) {
    console.error(`   ❌ Erro ao chamar API:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 TESTE COMPREHENSIVO DE EXCLUSÕES');
  console.log('====================================\n');
  
  // Buscar dados existentes
  const { data: vehicles } = await supabase.from('vehicles').select('id, plate').limit(1);
  const { data: drivers } = await supabase.from('users').select('id, email').eq('role', 'driver').limit(1);
  const { data: companies } = await supabase.from('companies').select('id, name').limit(1);
  
  const results = {};
  
  // Testar veículo
  if (vehicles && vehicles.length > 0) {
    results.vehicle = await testDeleteWithTrips('veículo', vehicles[0].id, '/api/admin/vehicles/delete');
  } else {
    console.log('\n⚠️ Nenhum veículo encontrado para testar');
    results.vehicle = true;
  }
  
  // Testar motorista
  if (drivers && drivers.length > 0) {
    results.driver = await testDeleteWithTrips('motorista', drivers[0].id, '/api/admin/drivers/delete');
  } else {
    console.log('\n⚠️ Nenhum motorista encontrado para testar');
    results.driver = true;
  }
  
  // Testar empresa
  if (companies && companies.length > 0) {
    console.log('\n🏢 Testando exclusão de empresa:');
    try {
      const response = await fetch(`http://localhost:3000/api/admin/companies/delete?id=${companies[0].id}`, {
        method: 'DELETE'
      });
      const result = await response.json();
      results.company = result.success;
      if (result.success) {
        console.log('   ✅ Exclusão de empresa bem-sucedida');
      } else {
        console.error('   ❌ Erro:', result.error);
      }
    } catch (error) {
      console.error('   ❌ Erro:', error.message);
      results.company = false;
    }
  } else {
    console.log('\n⚠️ Nenhuma empresa encontrada para testar');
    results.company = true;
  }
  
  console.log('\n====================================');
  console.log('📊 RESUMO FINAL:');
  console.log('====================================');
  console.log(`Veículos:  ${results.vehicle ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Motoristas: ${results.driver ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`Empresas:  ${results.company ? '✅ OK' : '❌ FALHOU'}`);
  console.log('====================================\n');
  
  const allPassed = Object.values(results).every(r => r);
  process.exit(allPassed ? 0 : 1);
}

main();

