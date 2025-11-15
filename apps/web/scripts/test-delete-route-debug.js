require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDeleteOrder() {
  console.log('\n🔍 TESTANDO ORDEM DE EXCLUSÃO...\n');

  try {
    // Buscar uma rota com trips
    const { data: routes } = await supabase
      .from('routes')
      .select(`
        id,
        name,
        trips!inner(id)
      `)
      .limit(1);

    if (!routes || routes.length === 0) {
      console.log('⚠️ Nenhuma rota com trips encontrada');
      return false;
    }

    const routeId = routes[0].id;
    const routeName = routes[0].name;

    console.log(`Rota: ${routeName} (${routeId})`);

    // Buscar trips
    const { data: trips } = await supabase
      .from('trips')
      .select('id')
      .eq('route_id', routeId)
      .limit(3);

    const tripIds = trips?.map(t => t.id) || [];
    console.log(`Trips encontrados: ${tripIds.length}`);

    if (tripIds.length === 0) {
      console.log('⚠️ Nenhum trip encontrado');
      return true;
    }

    const testTripId = tripIds[0];
    console.log(`\nTestando com trip: ${testTripId}`);

    // Verificar se tem trip_summary
    const { data: summary } = await supabase
      .from('trip_summary')
      .select('trip_id')
      .eq('trip_id', testTripId)
      .maybeSingle();

    console.log(`Trip_summary existe: ${!!summary}`);

    // Verificar se tem driver_positions
    const { data: positions } = await supabase
      .from('driver_positions')
      .select('id')
      .eq('trip_id', testTripId)
      .limit(1);

    console.log(`Driver_positions encontrados: ${positions?.length || 0}`);

    // TESTE 1: Excluir driver_positions primeiro
    console.log('\n🧪 TESTE 1: Excluindo driver_positions primeiro...');
    if (positions && positions.length > 0) {
      const { error: posError } = await supabase
        .from('driver_positions')
        .delete()
        .eq('trip_id', testTripId);

      if (posError) {
        console.error('   ❌ Erro:', posError.message);
        return false;
      }
      console.log('   ✅ Driver_positions excluído');
    } else {
      console.log('   ⚠️ Nenhum driver_position para excluir');
    }

    // TESTE 2: Excluir trip_summary
    console.log('\n🧪 TESTE 2: Excluindo trip_summary...');
    if (summary) {
      const { error: sumError } = await supabase
        .from('trip_summary')
        .delete()
        .eq('trip_id', testTripId);

      if (sumError) {
        console.error('   ❌ Erro:', sumError.message);
        console.error('   Código:', sumError.code);
        return false;
      }
      console.log('   ✅ Trip_summary excluído');
    } else {
      console.log('   ⚠️ Nenhum trip_summary para excluir');
    }

    // TESTE 3: Tentar excluir trip
    console.log('\n🧪 TESTE 3: Tentando excluir trip...');
    const { error: tripError } = await supabase
      .from('trips')
      .delete()
      .eq('id', testTripId);

    if (tripError) {
      console.error('   ❌ Erro ao excluir trip:', tripError.message);
      console.error('   Código:', tripError.code);
      console.error('   Detalhes:', tripError.details);
      return false;
    }

    console.log('   ✅ Trip excluído com sucesso!');
    console.log('\n✅ ORDEM CORRETA: driver_positions -> trip_summary -> trips');

    return true;

  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

async function main() {
  const success = await testDeleteOrder();
  process.exit(success ? 0 : 1);
}

main();

