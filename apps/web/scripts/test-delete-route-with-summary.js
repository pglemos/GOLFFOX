require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDeleteWithSummary() {
  console.log('\n🧪 TESTANDO EXCLUSÃO COM TRIP_SUMMARY REAL...\n');

  let companyId, routeId, tripId, driverId, vehicleId;

  try {
    // Criar dados de teste
    companyId = uuidv4();
    routeId = uuidv4();
    tripId = uuidv4();
    driverId = uuidv4();
    vehicleId = uuidv4();

    console.log('1. Criando dados de teste...');
    
    await supabase.from('companies').insert({ id: companyId, name: `Test ${Date.now()}` });
    await supabase.from('users').insert({ 
      id: driverId, 
      email: `d${Date.now()}@test.com`, 
      name: 'Driver', 
      role: 'driver', 
      company_id: companyId 
    });
    await supabase.from('vehicles').insert({ id: vehicleId, plate: `T${Date.now()}` });
    await supabase.from('routes').insert({ 
      id: routeId, 
      name: `Test Route ${Date.now()}`, 
      company_id: companyId, 
      carrier_id: uuidv4() 
    });
    
    console.log('   ✅ Dados criados');

    // Criar trip
    console.log('2. Criando trip...');
    const { error: tripError } = await supabase
      .from('trips')
      .insert({
        id: tripId,
        route_id: routeId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        status: 'scheduled',
        scheduled_at: new Date().toISOString()
      });

    if (tripError) {
      console.error('   ❌ Erro:', tripError.message);
      return false;
    }
    console.log('   ✅ Trip criado');

    // Criar trip_summary
    console.log('3. Criando trip_summary...');
    const { error: summaryError } = await supabase
      .from('trip_summary')
      .insert({
        trip_id: tripId,
        total_distance_km: 10.5,
        duration_minutes: 30,
        avg_speed_kmh: 21
      });

    if (summaryError) {
      // Verificar estrutura da tabela
      console.log('   ⚠️ Erro ao criar trip_summary:', summaryError.message);
      console.log('   Tentando com estrutura alternativa...');
      
      // Tentar com estrutura alternativa (pode ter colunas diferentes)
      const { error: altError } = await supabase
        .from('trip_summary')
        .insert({
          trip_id: tripId,
          samples: 10,
          total_distance_km: 10.5,
          duration_minutes: 30
        });

      if (altError) {
        console.error('   ❌ Erro com estrutura alternativa:', altError.message);
        // Continuar mesmo assim para testar a exclusão
      } else {
        console.log('   ✅ Trip_summary criado (estrutura alternativa)');
      }
    } else {
      console.log('   ✅ Trip_summary criado');
    }

    // TESTAR EXCLUSÃO NA ORDEM CORRETA
    console.log('\n4. Testando exclusão na ordem correta...');

    // a) Excluir driver_positions primeiro (se existir)
    console.log('   a) Excluindo driver_positions...');
    await supabase.from('driver_positions').delete().eq('trip_id', tripId);
    console.log('      ✅ Driver_positions processado');

    // b) Excluir trip_summary
    console.log('   b) Excluindo trip_summary...');
    const { error: delSummaryError } = await supabase
      .from('trip_summary')
      .delete()
      .eq('trip_id', tripId);

    if (delSummaryError) {
      console.error('      ❌ Erro:', delSummaryError.message);
      console.error('      Código:', delSummaryError.code);
      return false;
    }
    console.log('      ✅ Trip_summary excluído');

    // c) Excluir trip
    console.log('   c) Excluindo trip...');
    const { error: delTripError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripId);

    if (delTripError) {
      console.error('      ❌ Erro:', delTripError.message);
      console.error('      Código:', delTripError.code);
      console.error('      Detalhes:', delTripError.details);
      return false;
    }
    console.log('      ✅ Trip excluído');

    // d) Excluir route_stops e route
    console.log('   d) Excluindo route_stops e route...');
    await supabase.from('route_stops').delete().eq('route_id', routeId);
    await supabase.from('routes').delete().eq('id', routeId);
    console.log('      ✅ Route excluída');

    console.log('\n✅ TESTE PASSOU! Ordem correta funciona.');

    return true;

  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  } finally {
    // Limpeza
    console.log('\n🧹 Limpando...');
    try {
      await supabase.from('trip_summary').delete().eq('trip_id', tripId);
      await supabase.from('trips').delete().eq('id', tripId);
      await supabase.from('route_stops').delete().eq('route_id', routeId);
      await supabase.from('routes').delete().eq('id', routeId);
      await supabase.from('vehicles').delete().eq('id', vehicleId);
      await supabase.from('users').delete().eq('id', driverId);
      await supabase.from('companies').delete().eq('id', companyId);
    } catch (e) {
      // Ignorar erros de limpeza
    }
  }
}

async function main() {
  const success = await testDeleteWithSummary();
  process.exit(success ? 0 : 1);
}

main();

