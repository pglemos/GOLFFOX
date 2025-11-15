require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDeleteRouteAPI() {
  console.log('\n🧪 TESTANDO EXCLUSÃO DE ROTA VIA API COM TRIP_SUMMARY...\n');

  try {
    // 1. Buscar uma rota que tenha trips
    console.log('1. Buscando rota com trips...');
    const { data: routesWithTrips, error: routesError } = await supabase
      .from('routes')
      .select(`
        id,
        name,
        trips!inner(id)
      `)
      .limit(1);

    let testRouteId = null;
    let testRouteName = null;

    if (routesError || !routesWithTrips || routesWithTrips.length === 0) {
      console.log('   ⚠️ Nenhuma rota com trips encontrada. Buscando qualquer rota...');
      const { data: anyRoute } = await supabase
        .from('routes')
        .select('id, name')
        .limit(1);

      if (anyRoute && anyRoute.length > 0) {
        testRouteId = anyRoute[0].id;
        testRouteName = anyRoute[0].name;
        console.log(`   ✅ Rota encontrada: ${testRouteName} (sem trips)`);
      } else {
        console.log('   ❌ Nenhuma rota encontrada no banco');
        return false;
      }
    } else {
      testRouteId = routesWithTrips[0].id;
      testRouteName = routesWithTrips[0].name;
      console.log(`   ✅ Rota encontrada: ${testRouteName}`);
    }

    // 2. Verificar trips e trip_summary
    console.log('\n2. Verificando dependências...');
    const { data: trips } = await supabase
      .from('trips')
      .select('id')
      .eq('route_id', testRouteId);

    const tripIds = trips?.map(t => t.id) || [];
    console.log(`   ✅ Encontrados ${tripIds.length} trip(s)`);

    if (tripIds.length > 0) {
      const { data: summaries } = await supabase
        .from('trip_summary')
        .select('trip_id')
        .in('trip_id', tripIds);

      console.log(`   ✅ Encontrados ${summaries?.length || 0} registro(s) em trip_summary`);
    }

    // 3. Testar exclusão via API (simulando a lógica da API)
    console.log('\n3. Testando lógica de exclusão (simulando API)...');

    if (tripIds.length > 0) {
      // Excluir trip_summary primeiro
      console.log('   a) Excluindo trip_summary...');
      const { error: summaryError } = await supabase
        .from('trip_summary')
        .delete()
        .in('trip_id', tripIds);

      if (summaryError) {
        if (summaryError.code === '42P01') {
          console.log('      ⚠️ Tabela trip_summary não existe (OK)');
        } else {
          console.error('      ❌ Erro:', summaryError.message);
          console.error('      Código:', summaryError.code);
          return false;
        }
      } else {
        console.log('      ✅ Trip_summary excluído');
      }

      // Excluir trips
      console.log('   b) Excluindo trips...');
      const { error: tripsError } = await supabase
        .from('trips')
        .delete()
        .eq('route_id', testRouteId);

      if (tripsError) {
        console.error('      ❌ Erro ao excluir trips:', tripsError.message);
        console.error('      Código:', tripsError.code);
        return false;
      }
      console.log('      ✅ Trips excluídos');
    }

    // Excluir route_stops
    console.log('   c) Excluindo route_stops...');
    const { error: stopsError } = await supabase
      .from('route_stops')
      .delete()
      .eq('route_id', testRouteId);

    if (stopsError && stopsError.code !== '42P01') {
      console.error('      ❌ Erro:', stopsError.message);
      return false;
    }
    console.log('      ✅ Route_stops excluídos (ou não existiam)');

    // Excluir rota
    console.log('   d) Excluindo rota...');
    const { error: routeError } = await supabase
      .from('routes')
      .delete()
      .eq('id', testRouteId);

    if (routeError) {
      console.error('      ❌ Erro ao excluir rota:', routeError.message);
      console.error('      Código:', routeError.code);
      return false;
    }
    console.log('      ✅ Rota excluída');

    // 4. Verificar se tudo foi excluído
    console.log('\n4. Verificando exclusão...');
    const { count: routeCount } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('id', testRouteId);

    const { count: tripCount } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', testRouteId);

    if (routeCount === 0 && tripCount === 0) {
      console.log('   ✅ Tudo excluído com sucesso!');
      return true;
    } else {
      console.error(`   ❌ Falha: Rota (${routeCount}), Trips (${tripCount})`);
      return false;
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 TESTE DE EXCLUSÃO DE ROTA VIA API');
  console.log('====================================\n');

  const success = await testDeleteRouteAPI();

  console.log('\n====================================');
  if (success) {
    console.log('✅ TESTE PASSOU!');
    console.log('\n💡 A exclusão está funcionando corretamente.');
    console.log('   A ordem de exclusão garante que trip_summary é excluído antes de trips.');
    process.exit(0);
  } else {
    console.log('❌ TESTE FALHOU!');
    console.log('\n⚠️ Verifique os erros acima e corrija a API.');
    process.exit(1);
  }
}

main();

