require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testRealAPIDelete() {
  console.log('\n🧪 TESTANDO EXCLUSÃO REAL VIA API...\n');

  try {
    // 1. Buscar uma rota que tenha trips e trip_summary
    console.log('1. Buscando rota com trips e trip_summary...');
    
    // Buscar trips que tenham trip_summary
    const { data: tripsWithSummary } = await supabase
      .from('trips')
      .select(`
        id,
        route_id,
        routes!inner(id, name)
      `)
      .limit(10);

    if (!tripsWithSummary || tripsWithSummary.length === 0) {
      console.log('   ⚠️ Nenhum trip encontrado');
      return false;
    }

    // Verificar qual tem trip_summary
    let testRouteId = null;
    let testRouteName = null;
    let testTripId = null;

    for (const trip of tripsWithSummary) {
      const { data: summary } = await supabase
        .from('trip_summary')
        .select('trip_id')
        .eq('trip_id', trip.id)
        .maybeSingle();

      if (summary) {
        testRouteId = trip.route_id;
        testRouteName = trip.routes?.name || 'Rota';
        testTripId = trip.id;
        break;
      }
    }

    if (!testRouteId) {
      console.log('   ⚠️ Nenhuma rota com trip_summary encontrada');
      console.log('   💡 Testando com qualquer rota que tenha trips...');
      
      const { data: anyRoute } = await supabase
        .from('routes')
        .select(`
          id,
          name,
          trips!inner(id)
        `)
        .limit(1);

      if (anyRoute && anyRoute.length > 0) {
        testRouteId = anyRoute[0].id;
        testRouteName = anyRoute[0].name;
        console.log(`   ✅ Rota encontrada: ${testRouteName}`);
      } else {
        console.log('   ❌ Nenhuma rota encontrada');
        return false;
      }
    } else {
      console.log(`   ✅ Rota encontrada: ${testRouteName} (com trip_summary)`);
    }

    // 2. Verificar estado antes
    console.log('\n2. Estado antes da exclusão:');
    const { count: tripsBefore } = await supabase
      .from('trips')
      .select('*', { count: 'exact', head: true })
      .eq('route_id', testRouteId);

    const { data: tripsData } = await supabase
      .from('trips')
      .select('id')
      .eq('route_id', testRouteId);

    const tripIdsBefore = tripsData?.map(t => t.id) || [];
    
    const { count: summaryBefore } = await supabase
      .from('trip_summary')
      .select('*', { count: 'exact', head: true })
      .in('trip_id', tripIdsBefore);

    console.log(`   Trips: ${tripsBefore}`);
    console.log(`   Trip_summary: ${summaryBefore}`);

    // 3. Chamar API de exclusão
    console.log('\n3. Chamando API de exclusão...');
    
    return new Promise((resolve) => {
      const url = new URL(`/api/admin/routes/delete?id=${testRouteId}`, appUrl);
      
      const req = http.request(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`
        }
      }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (res.statusCode === 200 && result.success) {
              console.log('   ✅ API retornou sucesso');
              
              // 4. Verificar estado depois
              console.log('\n4. Estado depois da exclusão:');
              setTimeout(async () => {
                const { count: tripsAfter } = await supabase
                  .from('trips')
                  .select('*', { count: 'exact', head: true })
                  .eq('route_id', testRouteId);

                const { count: routeAfter } = await supabase
                  .from('routes')
                  .select('*', { count: 'exact', head: true })
                  .eq('id', testRouteId);

                console.log(`   Trips: ${tripsAfter}`);
                console.log(`   Route: ${routeAfter}`);

                if (tripsAfter === 0 && routeAfter === 0) {
                  console.log('\n✅ TESTE PASSOU! Rota e trips excluídos permanentemente.');
                  resolve(true);
                } else {
                  console.log('\n❌ TESTE FALHOU! Alguns registros ainda existem.');
                  resolve(false);
                }
              }, 1000);
            } else {
              console.error('   ❌ API retornou erro:', result.error || result.message);
              console.error('   Status:', res.statusCode);
              resolve(false);
            }
          } catch (err) {
            console.error('   ❌ Erro ao parsear resposta:', err);
            resolve(false);
          }
        });
      });

      req.on('error', (err) => {
        console.error('   ❌ Erro na requisição:', err.message);
        console.log('   💡 Certifique-se de que o servidor está rodando: npm run dev');
        resolve(false);
      });

      req.end();
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 TESTE DE EXCLUSÃO REAL VIA API');
  console.log('==================================\n');

  const success = await testRealAPIDelete();

  console.log('\n==================================');
  if (success) {
    console.log('✅ TESTE PASSOU!');
    process.exit(0);
  } else {
    console.log('❌ TESTE FALHOU!');
    process.exit(1);
  }
}

main();

