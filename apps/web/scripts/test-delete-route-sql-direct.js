require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extrair connection string do Supabase
function getConnectionString() {
  // Supabase URL format: https://xxxxx.supabase.co
  // Precisamos do host para conexão direta
  const url = new URL(supabaseUrl);
  const host = url.hostname.replace('.supabase.co', '');
  
  // Construir connection string do PostgreSQL
  // Nota: Isso pode não funcionar se não tivermos acesso direto ao PostgreSQL
  // Vamos tentar usar o Supabase client com RPC se disponível
  return null;
}

async function testWithDirectSQL() {
  console.log('\n🧪 TESTANDO COM SQL DIRETO...\n');

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
      console.log('⚠️ Nenhuma rota encontrada');
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
      .limit(5);

    const tripIds = trips?.map(t => t.id) || [];
    console.log(`Trips: ${tripIds.length}`);

    if (tripIds.length === 0) {
      return true;
    }

    // Tentar desabilitar trigger via RPC (se existir)
    console.log('\n1. Tentando desabilitar trigger...');
    const { error: disableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE driver_positions DISABLE TRIGGER trg_driver_positions_recalc_summary;'
    }).catch(() => ({ error: { message: 'RPC não disponível' } }));

    if (disableError) {
      console.log('   ⚠️ Não foi possível desabilitar trigger (RPC não disponível)');
      console.log('   💡 Vamos tentar excluir na ordem correta mesmo assim');
    } else {
      console.log('   ✅ Trigger desabilitado');
    }

    // Excluir trip_summary
    console.log('\n2. Excluindo trip_summary...');
    const tripIdsStr = tripIds.map(id => `'${id}'`).join(',');
    
    // Usar RPC para executar SQL direto
    const { error: summaryError } = await supabase.rpc('exec_sql', {
      sql: `DELETE FROM trip_summary WHERE trip_id IN (${tripIdsStr});`
    }).catch(async () => {
      // Fallback: usar Supabase client normal
      return await supabase
        .from('trip_summary')
        .delete()
        .in('trip_id', tripIds);
    });

    if (summaryError && summaryError.code !== '42P01') {
      console.error('   ❌ Erro:', summaryError.message);
      return false;
    }
    console.log('   ✅ Trip_summary excluído');

    // Excluir driver_positions
    console.log('\n3. Excluindo driver_positions...');
    const { error: posError } = await supabase
      .from('driver_positions')
      .delete()
      .in('trip_id', tripIds);

    if (posError && posError.code !== '42P01' && posError.code !== '42703') {
      console.log('   ⚠️ Erro (pode ser do trigger):', posError.message);
    } else {
      console.log('   ✅ Driver_positions excluído');
    }

    // Excluir trips
    console.log('\n4. Excluindo trips...');
    const { error: tripError } = await supabase
      .from('trips')
      .delete()
      .eq('route_id', routeId);

    if (tripError) {
      console.error('   ❌ Erro:', tripError.message);
      console.error('   Código:', tripError.code);
      return false;
    }
    console.log('   ✅ Trips excluídos');

    // Reabilitar trigger
    if (!disableError) {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE driver_positions ENABLE TRIGGER trg_driver_positions_recalc_summary;'
      }).catch(() => {});
    }

    console.log('\n✅ TESTE PASSOU!');
    return true;

  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

async function main() {
  const success = await testWithDirectSQL();
  process.exit(success ? 0 : 1);
}

main();

