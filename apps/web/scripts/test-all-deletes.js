require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDelete(endpoint, itemName, getIdFn) {
  try {
    console.log(`\n🧪 Testando exclusão de ${itemName}...`);
    
    // Buscar item para excluir
    const item = await getIdFn();
    if (!item) {
      console.log(`   ⚠️ Nenhum ${itemName} encontrado para testar`);
      return true; // Não é erro se não houver dados
    }

    console.log(`   ✅ ${itemName} encontrado: ${item.id}`);

    // Testar exclusão via API
    const response = await fetch(`${appUrl}${endpoint}?id=${item.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Erro na API: ${result.message || result.error}`);
      return false;
    }

    if (result.success) {
      console.log(`   ✅ ${itemName} excluído com sucesso!`);
      return true;
    } else {
      console.error(`   ❌ API retornou falha: ${result.error}`);
      return false;
    }

  } catch (error) {
    console.error(`   ❌ Erro ao testar exclusão de ${itemName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 TESTE COMPLETO DE EXCLUSÕES');
  console.log('===============================\n');

  const results = {
    empresas: false,
    rotas: false,
    veiculos: false,
    motoristas: false,
    alertas: false,
    socorro: false,
    permissoes: false
  };

  // Testar exclusão de empresas
  results.empresas = await testDelete(
    '/api/admin/companies/delete',
    'Empresa',
    async () => {
      const { data } = await supabase.from('companies').select('id, name').limit(1).maybeSingle();
      return data;
    }
  );

  // Testar exclusão de rotas
  results.rotas = await testDelete(
    '/api/admin/routes/delete',
    'Rota',
    async () => {
      const { data } = await supabase.from('routes').select('id, name').limit(1).maybeSingle();
      return data;
    }
  );

  // Testar exclusão de veículos
  results.veiculos = await testDelete(
    '/api/admin/vehicles/delete',
    'Veículo',
    async () => {
      const { data } = await supabase.from('vehicles').select('id, plate').limit(1).maybeSingle();
      return data;
    }
  );

  // Testar exclusão de motoristas
  results.motoristas = await testDelete(
    '/api/admin/drivers/delete',
    'Motorista',
    async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'driver')
        .limit(1)
        .maybeSingle();
      return data;
    }
  );

  // Testar exclusão de alertas
  results.alertas = await testDelete(
    '/api/admin/alerts/delete',
    'Alerta',
    async () => {
      const { data } = await supabase.from('alerts').select('id').limit(1).maybeSingle();
      return data;
    }
  );

  // Testar exclusão de socorro
  results.socorro = await testDelete(
    '/api/admin/assistance-requests/delete',
    'Socorro',
    async () => {
      const { data } = await supabase.from('gf_service_requests').select('id').limit(1).maybeSingle();
      return data;
    }
  );

  // Testar exclusão de permissões (usuários)
  results.permissoes = await testDelete(
    '/api/admin/users/delete',
    'Usuário',
    async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name')
        .neq('role', 'admin')
        .limit(1)
        .maybeSingle();
      return data;
    }
  );

  // Resumo
  console.log('\n===============================');
  console.log('📊 RESUMO DOS TESTES:');
  console.log('===============================\n');

  const allPassed = Object.entries(results).every(([key, value]) => {
    const status = value ? '✅' : '❌';
    const name = {
      empresas: 'Empresas',
      rotas: 'Rotas',
      veiculos: 'Veículos',
      motoristas: 'Motoristas',
      alertas: 'Alertas',
      socorro: 'Socorro',
      permissoes: 'Permissões'
    }[key];
    console.log(`${status} ${name}`);
    return value;
  });

  console.log('\n===============================');
  if (allPassed) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
    process.exit(0);
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM!');
    process.exit(1);
  }
}

main();
