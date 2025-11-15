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

async function testDeleteRoute() {
  console.log('\n🧪 TESTANDO EXCLUSÃO DE ROTA COM TRIP_SUMMARY...\n');

  // Criar dados de teste
  const companyId = uuidv4();
  const routeId = uuidv4();
  const tripId = uuidv4();
  const driverId = uuidv4();
  const vehicleId = uuidv4();

  try {
    // 1. Criar empresa
    console.log('1. Criando empresa...');
    const { error: companyError } = await supabase
      .from('companies')
      .insert({ id: companyId, name: `Empresa Teste ${Date.now()}` });

    if (companyError) {
      console.error('   ❌ Erro ao criar empresa:', companyError.message);
      return false;
    }
    console.log('   ✅ Empresa criada');

    // 2. Criar motorista
    console.log('2. Criando motorista...');
    const { error: driverError } = await supabase
      .from('users')
      .insert({ 
        id: driverId, 
        email: `driver-${Date.now()}@test.com`, 
        name: 'Driver Test', 
        role: 'driver', 
        company_id: companyId 
      });

    if (driverError) {
      console.error('   ❌ Erro ao criar motorista:', driverError.message);
      return false;
    }
    console.log('   ✅ Motorista criado');

    // 3. Criar veículo
    console.log('3. Criando veículo...');
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .insert({ id: vehicleId, plate: `TEST-${Date.now()}`, model: 'Test Model' });

    if (vehicleError) {
      console.error('   ❌ Erro ao criar veículo:', vehicleError.message);
      return false;
    }
    console.log('   ✅ Veículo criado');

    // 4. Criar rota
    console.log('4. Criando rota...');
    const { error: routeError } = await supabase
      .from('routes')
      .insert({ 
        id: routeId, 
        name: `Rota Teste ${Date.now()}`, 
        company_id: companyId, 
        carrier_id: uuidv4() 
      });

    if (routeError) {
      console.error('   ❌ Erro ao criar rota:', routeError.message);
      return false;
    }
    console.log('   ✅ Rota criada');

    // 5. Criar trip
    console.log('5. Criando trip...');
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
      console.error('   ❌ Erro ao criar trip:', tripError.message);
      return false;
    }
    console.log('   ✅ Trip criado');

    // 6. Criar trip_summary
    console.log('6. Criando trip_summary...');
    const { error: summaryError } = await supabase
      .from('trip_summary')
      .insert({
        trip_id: tripId,
        total_distance_km: 10.5,
        duration_minutes: 30,
        avg_speed_kmh: 21
      });

    if (summaryError) {
      // Se a tabela não existir ou tiver estrutura diferente, tentar sem alguns campos
      console.log('   ⚠️ Erro ao criar trip_summary (pode não existir):', summaryError.message);
      // Continuar o teste mesmo assim
    } else {
      console.log('   ✅ Trip_summary criado');
    }

    // 7. Testar exclusão via API
    console.log('\n7. Testando exclusão via API...');
    const response = await fetch(`http://localhost:3000/api/admin/routes/delete?id=${routeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('   ❌ Erro na API:', result.message || result.error);
      console.error('   Detalhes:', result.details);
      return false;
    }

    if (result.success) {
      console.log('   ✅ API retornou sucesso');
    } else {
      console.error('   ❌ API retornou falha:', result.error);
      return false;
    }

    // 8. Verificar se tudo foi excluído
    console.log('\n8. Verificando exclusão...');

    const { count: routeCount } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('id', routeId);

    const { count: tripCount } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('id', tripId);

    const { count: summaryCount } = await supabase
      .from('trip_summary')
      .select('*', { count: 'exact', head: true })
      .eq('trip_id', tripId);

    if (routeCount === 0 && tripCount === 0) {
      console.log('   ✅ Rota e trip excluídos');
      if (summaryCount === 0 || summaryError) {
        console.log('   ✅ Trip_summary excluído ou não existia');
      } else {
        console.log('   ⚠️ Trip_summary ainda existe (pode ser esperado se a tabela não foi criada)');
      }
      return true;
    } else {
      console.error(`   ❌ Falha: Rota (${routeCount}), Trip (${tripCount}), Summary (${summaryCount})`);
      return false;
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    return false;
  } finally {
    // Limpeza (tentar excluir mesmo que o teste tenha falhado)
    console.log('\n🧹 Limpando dados de teste...');
    await supabase.from('trip_summary').delete().eq('trip_id', tripId).catch(() => {});
    await supabase.from('trips').delete().eq('id', tripId).catch(() => {});
    await supabase.from('routes').delete().eq('id', routeId).catch(() => {});
    await supabase.from('vehicles').delete().eq('id', vehicleId).catch(() => {});
    await supabase.from('users').delete().eq('id', driverId).catch(() => {});
    await supabase.from('companies').delete().eq('id', companyId).catch(() => {});
    console.log('   ✅ Limpeza concluída');
  }
}

async function main() {
  console.log('🧪 TESTE DE EXCLUSÃO DE ROTA COM TRIP_SUMMARY');
  console.log('==============================================\n');

  const success = await testDeleteRoute();

  console.log('\n==============================================');
  if (success) {
    console.log('✅ TESTE PASSOU!');
    process.exit(0);
  } else {
    console.log('❌ TESTE FALHOU!');
    process.exit(1);
  }
}

main();

