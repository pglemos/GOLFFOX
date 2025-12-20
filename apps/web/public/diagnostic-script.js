/**
 * Script de Diagnóstico - Mapa de Veículos
 * 
 * Cole este script no console do navegador (F12) para diagnosticar problemas
 */

console.log('🔍 Iniciando diagnóstico automático...\n');

async function runDiagnostic() {
  const { createClient } = supabase;
  const supabaseClient = createClient(
    'https://vmoxzesvjcfmrebagcwo.supabase.co',
    'sua-anon-key-aqui' // Substituir pela chave correta
  );

  const results = {
    auth: null,
    userInfo: null,
    veiculos: null,
    trips: null,
    positions: null,
    routes: null,
    rls: null,
    errors: []
  };

  // 1. Verificar autenticação
  console.log('1️⃣  Verificando autenticação...');
  try {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    results.auth = { 
      authenticated: !!user,
      userId: user?.id,
      email: user?.email 
    };
    console.log('✅ Autenticado como:', user?.email);
  } catch (error) {
    results.errors.push({ step: 'auth', error: error.message });
    console.error('❌ Erro na autenticação:', error);
  }

  // 2. Verificar informações do usuário
  console.log('\n2️⃣  Verificando informações do usuário...');
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('role, company_id, transportadora_id')
      .eq('id', results.auth.userId)
      .single();
    
    if (error) throw error;
    results.userInfo = data;
    console.log('✅ Role do usuário:', data.role);
    console.log('✅ Company ID:', data.company_id || 'null');
    console.log('✅ transportadora ID:', data.transportadora_id || 'null');
  } catch (error) {
    results.errors.push({ step: 'userInfo', error: error.message });
    console.error('❌ Erro ao buscar informações do usuário:', error);
  }

  // 3. Verificar veículos ativos
  console.log('\n3️⃣  Verificando veículos ativos...');
  try {
    const { data, error, count } = await supabaseClient
      .from('veiculos')
      .select('id, plate, model, is_active, company_id', { count: 'exact' })
      .eq('is_active', true);
    
    if (error) throw error;
    results.veiculos = { count, data: data?.slice(0, 3) };
    console.log(`✅ Encontrados ${count} veículos ativos`);
    if (data && data.length > 0) {
      console.log('   Primeiros veículos:', data.slice(0, 3));
    } else {
      console.warn('⚠️  Nenhum veículo ativo encontrado!');
    }
  } catch (error) {
    results.errors.push({ step: 'veiculos', error: error.message });
    console.error('❌ Erro ao buscar veículos:', error);
  }

  // 4. Verificar trips ativas
  console.log('\n4️⃣  Verificando trips ativas...');
  try {
    const { data, error, count } = await supabaseClient
      .from('trips')
      .select('id, veiculo_id, status', { count: 'exact' })
      .eq('status', 'inProgress');
    
    if (error) throw error;
    results.trips = { count, data: data?.slice(0, 3) };
    console.log(`✅ Encontradas ${count} trips ativas`);
    if (count === 0) {
      console.warn('⚠️  Nenhuma trip ativa encontrada!');
    }
  } catch (error) {
    results.errors.push({ step: 'trips', error: error.message });
    console.error('❌ Erro ao buscar trips:', error);
  }

  // 5. Verificar posições GPS recentes
  console.log('\n5️⃣  Verificando posições GPS recentes...');
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data, error, count } = await supabaseClient
      .from('motorista_positions')
      .select('id, trip_id, lat, lng, timestamp', { count: 'exact' })
      .gte('timestamp', oneHourAgo);
    
    if (error) throw error;
    results.positions = { count, data: data?.slice(0, 3) };
    console.log(`✅ Encontradas ${count} posições GPS na última hora`);
    if (count === 0) {
      console.warn('⚠️  Nenhuma posição GPS recente encontrada!');
    }
  } catch (error) {
    results.errors.push({ step: 'positions', error: error.message });
    console.error('❌ Erro ao buscar posições:', error);
  }

  // 6. Verificar rotas ativas
  console.log('\n6️⃣  Verificando rotas ativas...');
  try {
    const { data, error, count } = await supabaseClient
      .from('routes')
      .select('id, name, is_active', { count: 'exact' })
      .eq('is_active', true);
    
    if (error) throw error;
    results.routes = { count };
    console.log(`✅ Encontradas ${count} rotas ativas`);
  } catch (error) {
    results.errors.push({ step: 'routes', error: error.message });
    console.error('❌ Erro ao buscar rotas:', error);
  }

  // 7. Testar políticas RLS
  console.log('\n7️⃣  Testando políticas RLS...');
  try {
    // Tentar inserir um veículo de teste (será revertido)
    const testVehicle = {
      plate: 'TEST-DIAGNOSTIC',
      model: 'Test Model',
      is_active: false,
      company_id: results.userInfo?.company_id
    };
    
    const { error } = await supabaseClient
      .from('veiculos')
      .insert(testVehicle)
      .select()
      .single();
    
    if (error) {
      if (error.message.includes('row-level security')) {
        results.rls = { blocked: true, message: error.message };
        console.warn('⚠️  RLS bloqueou inserção:', error.message);
      } else {
        throw error;
      }
    } else {
      results.rls = { blocked: false };
      console.log('✅ RLS permite inserção');
      // Deletar veículo de teste
      await supabaseClient
        .from('veiculos')
        .delete()
        .eq('plate', 'TEST-DIAGNOSTIC');
    }
  } catch (error) {
    results.errors.push({ step: 'rls', error: error.message });
    console.error('❌ Erro ao testar RLS:', error);
  }

  // Resumo
  console.log('\n📊 RESUMO DO DIAGNÓSTICO\n');
  console.log('═══════════════════════════════════════\n');
  
  console.log('Autenticação:', results.auth?.authenticated ? '✅' : '❌');
  console.log('Role do usuário:', results.userInfo?.role || '❌');
  console.log('Veículos ativos:', results.veiculos?.count || 0);
  console.log('Trips ativas:', results.trips?.count || 0);
  console.log('Posições GPS recentes:', results.positions?.count || 0);
  console.log('Rotas ativas:', results.routes?.count || 0);
  console.log('RLS bloqueando:', results.rls?.blocked ? '⚠️  SIM' : '✅ NÃO');
  
  if (results.errors.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:\n');
    results.errors.forEach((err, i) => {
      console.error(`${i + 1}. [${err.step}]:`, err.error);
    });
  }

  // Recomendações
  console.log('\n💡 RECOMENDAÇÕES:\n');
  
  if (!results.auth?.authenticated) {
    console.log('🔴 CRÍTICO: Usuário não está autenticado. Faça login primeiro.');
  }
  
  if (results.veiculos?.count === 0) {
    console.log('🔴 CRÍTICO: Não há veículos ativos no banco de dados.');
    console.log('   Solução: Execute o script database/CREATE_TEST_DATA.sql no Supabase.');
  }
  
  if (results.rls?.blocked) {
    console.log('🔴 CRÍTICO: RLS está bloqueando operações.');
    console.log('   Solução: Execute database/migrations/v48_fix_vehicles_rls.sql no Supabase.');
  }
  
  if (results.trips?.count === 0) {
    console.log('⚠️  AVISO: Não há trips ativas. Veículos aparecerão como "na garagem".');
  }
  
  if (results.positions?.count === 0) {
    console.log('⚠️  AVISO: Não há posições GPS recentes. Veículos não aparecerão no mapa.');
  }

  console.log('\n═══════════════════════════════════════\n');
  
  return results;
}

// Executar diagnóstico
runDiagnostic().then(results => {
  console.log('\n✅ Diagnóstico completo!');
  console.log('Resultados salvos em window.diagnosticResults');
  window.diagnosticResults = results;
}).catch(error => {
  console.error('\n❌ Erro ao executar diagnóstico:', error);
});

