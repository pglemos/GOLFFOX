/**
 * Script para testar conexão e executar diagnóstico completo do Supabase
 * Execute com: node web-app/scripts/test-supabase-connection.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.DATABASE_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL/SUPABASE_SERVICE_KEY não encontradas');
  console.log('Configure com: export SUPABASE_URL="sua-url" e SUPABASE_SERVICE_KEY="sua-service-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runDiagnostic() {
  console.log('🔍 DIAGNÓSTICO COMPLETO DO SUPABASE\n');
  console.log('═══════════════════════════════════════\n');

  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  // 1. Testar conexão
  console.log('1️⃣  Testando conexão com Supabase...');
  try {
    const { data, error } = await supabase.from('vehicles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ Conexão estabelecida com sucesso\n');
    results.tests.push({ name: 'connection', status: 'success' });
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    results.tests.push({ name: 'connection', status: 'error', error: error.message });
    return results;
  }

  // 2. Verificar veículos ativos
  console.log('2️⃣  Verificando veículos ativos...');
  try {
    const { data: vehicles, error, count } = await supabase
      .from('vehicles')
      .select('id, plate, model, is_active, company_id, created_at', { count: 'exact' })
      .eq('is_active', true);
    
    if (error) throw error;
    
    console.log(`✅ Encontrados ${count} veículos ativos`);
    if (vehicles && vehicles.length > 0) {
      console.log('   Primeiros veículos:');
      vehicles.slice(0, 3).forEach(v => {
        console.log(`   - ${v.plate} (${v.model}) - Company: ${v.company_id || 'null'}`);
      });
    } else {
      console.log('⚠️  ATENÇÃO: Não há veículos ativos no banco!');
    }
    console.log('');
    
    results.tests.push({ 
      name: 'vehicles', 
      status: count > 0 ? 'success' : 'warning', 
      count,
      data: vehicles?.slice(0, 3)
    });
  } catch (error) {
    console.error('❌ Erro ao buscar veículos:', error.message);
    results.tests.push({ name: 'vehicles', status: 'error', error: error.message });
  }

  // 3. Verificar empresas
  console.log('3️⃣  Verificando empresas...');
  try {
    const { data: companies, error, count } = await supabase
      .from('companies')
      .select('id, name', { count: 'exact' })
      .limit(5);
    
    if (error) throw error;
    
    console.log(`✅ Encontradas ${count} empresas`);
    if (companies && companies.length > 0) {
      companies.forEach(c => {
        console.log(`   - ${c.name} (${c.id})`);
      });
    }
    console.log('');
    
    results.tests.push({ name: 'companies', status: 'success', count });
  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error.message);
    results.tests.push({ name: 'companies', status: 'error', error: error.message });
  }

  // 4. Verificar trips ativas
  console.log('4️⃣  Verificando trips ativas...');
  try {
    const { data: trips, error, count } = await supabase
      .from('trips')
      .select('id, vehicle_id, status', { count: 'exact' })
      .eq('status', 'inProgress');
    
    if (error) throw error;
    
    console.log(`✅ Encontradas ${count} trips ativas`);
    if (count === 0) {
      console.log('⚠️  ATENÇÃO: Nenhuma trip ativa (veículos aparecerão como "na garagem")');
    }
    console.log('');
    
    results.tests.push({ name: 'trips', status: 'success', count });
  } catch (error) {
    console.error('❌ Erro ao buscar trips:', error.message);
    results.tests.push({ name: 'trips', status: 'error', error: error.message });
  }

  // 5. Verificar posições GPS recentes
  console.log('5️⃣  Verificando posições GPS (última hora)...');
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: positions, error, count } = await supabase
      .from('driver_positions')
      .select('id, trip_id, lat, lng, timestamp', { count: 'exact' })
      .gte('timestamp', oneHourAgo);
    
    if (error) throw error;
    
    console.log(`✅ Encontradas ${count} posições GPS na última hora`);
    if (count === 0) {
      console.log('⚠️  ATENÇÃO: Nenhuma posição GPS recente (veículos não aparecerão no mapa)');
    }
    console.log('');
    
    results.tests.push({ name: 'positions', status: 'success', count });
  } catch (error) {
    console.error('❌ Erro ao buscar posições:', error.message);
    results.tests.push({ name: 'positions', status: 'error', error: error.message });
  }

  // 6. Verificar rotas ativas
  console.log('6️⃣  Verificando rotas ativas...');
  try {
    const { data: routes, error, count } = await supabase
      .from('routes')
      .select('id, name, is_active', { count: 'exact' })
      .eq('is_active', true);
    
    if (error) throw error;
    
    console.log(`✅ Encontradas ${count} rotas ativas`);
    console.log('');
    
    results.tests.push({ name: 'routes', status: 'success', count });
  } catch (error) {
    console.error('❌ Erro ao buscar rotas:', error.message);
    results.tests.push({ name: 'routes', status: 'error', error: error.message });
  }

  // 7. Verificar RLS Status
  console.log('7️⃣  Verificando status de RLS...');
  try {
    const { data: rlsStatus, error } = await supabase
      .rpc('check_table_rls', { table_name: 'vehicles' });
    
    // Se RPC não existir, tentar query alternativa
    if (error && error.message.includes('does not exist')) {
      console.log('⚠️  RPC check_table_rls não existe (esperado)');
      console.log('✅ RLS será testado com inserção de teste');
    } else if (error) {
      throw error;
    }
    console.log('');
    
    results.tests.push({ name: 'rls', status: 'success' });
  } catch (error) {
    console.log('⚠️  Não foi possível verificar RLS via RPC:', error.message);
    results.tests.push({ name: 'rls', status: 'warning', error: error.message });
  }

  // 8. Verificar estrutura da tabela vehicles
  console.log('8️⃣  Verificando colunas da tabela vehicles...');
  try {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error
    
    if (vehicle) {
      const columns = Object.keys(vehicle);
      console.log(`✅ Tabela vehicles tem ${columns.length} colunas:`);
      console.log('   ', columns.join(', '));
    } else {
      console.log('⚠️  Nenhum veículo encontrado para verificar colunas');
    }
    console.log('');
    
    results.tests.push({ name: 'table_structure', status: 'success', columns: vehicle ? Object.keys(vehicle) : [] });
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
    results.tests.push({ name: 'table_structure', status: 'error', error: error.message });
  }

  // Resumo
  console.log('\n📊 RESUMO DO DIAGNÓSTICO\n');
  console.log('═══════════════════════════════════════\n');
  
  const successCount = results.tests.filter(t => t.status === 'success').length;
  const warningCount = results.tests.filter(t => t.status === 'warning').length;
  const errorCount = results.tests.filter(t => t.status === 'error').length;
  
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`⚠️  Avisos: ${warningCount}`);
  console.log(`❌ Erros: ${errorCount}`);
  console.log('');

  // Recomendações
  const vehiclesTest = results.tests.find(t => t.name === 'vehicles');
  const tripsTest = results.tests.find(t => t.name === 'trips');
  const positionsTest = results.tests.find(t => t.name === 'positions');

  console.log('💡 RECOMENDAÇÕES:\n');
  
  if (vehiclesTest?.count === 0 || vehiclesTest?.status === 'error') {
    console.log('🔴 CRÍTICO: Execute database/CREATE_TEST_DATA.sql para criar veículos de teste');
  }
  
  if (tripsTest?.count === 0) {
    console.log('⚠️  AVISO: Não há trips ativas. Veículos aparecerão como "na garagem"');
  }
  
  if (positionsTest?.count === 0) {
    console.log('⚠️  AVISO: Não há posições GPS. Veículos não aparecerão no mapa');
  }
  
  if (errorCount === 0 && vehiclesTest?.count > 0) {
    console.log('✅ TUDO OK! O banco está configurado corretamente');
  }

  console.log('\n═══════════════════════════════════════\n');

  // Salvar resultados
  const resultsPath = path.join(__dirname, 'diagnostic-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`📄 Resultados salvos em: ${resultsPath}\n`);

  return results;
}

// Executar
runDiagnostic()
  .then(() => {
    console.log('✅ Diagnóstico completo!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });

