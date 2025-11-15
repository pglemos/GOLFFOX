require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Erro: Variáveis de ambiente Supabase não configuradas.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function testDeleteCompany() {
  console.log('\n🧪 TESTANDO EXCLUSÃO DE EMPRESA...\n');

  try {
    // 1. Buscar uma empresa existente
    console.log('1. Buscando empresa existente...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    if (companiesError || !companies || companies.length === 0) {
      console.log('   ⚠️ Nenhuma empresa encontrada');
      return false;
    }

    const testCompany = companies[0];
    console.log(`   ✅ Empresa encontrada: ${testCompany.name} (${testCompany.id})`);

    // 2. Verificar dependências
    console.log('\n2. Verificando dependências...');
    
    const { count: routesCount } = await supabase
      .from('routes')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', testCompany.id);

    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', testCompany.id);

    const { count: employeesCount } = await supabase
      .from('gf_employee_company')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', testCompany.id);

    console.log(`   Routes: ${routesCount}`);
    console.log(`   Users: ${usersCount}`);
    console.log(`   Employees: ${employeesCount}`);

    // 3. Testar exclusão via API
    console.log('\n3. Testando exclusão via API...');
    const response = await fetch(`http://localhost:3000/api/admin/companies/delete?id=${testCompany.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('   ❌ Erro na API:', result.message || result.error);
      console.error('   Detalhes:', result.details);
      console.error('   Código:', result.code);
      return false;
    }

    if (result.success) {
      console.log('   ✅ API retornou sucesso');
    } else {
      console.error('   ❌ API retornou falha:', result.error);
      return false;
    }

    // 4. Verificar se foi excluída
    console.log('\n4. Verificando exclusão...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { count: companyAfter } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('id', testCompany.id);

    if (companyAfter === 0) {
      console.log('   ✅ Empresa excluída com sucesso!');
      return true;
    } else {
      console.error('   ❌ Empresa ainda existe');
      return false;
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
    return false;
  }
}

async function main() {
  console.log('🧪 TESTE DE EXCLUSÃO DE EMPRESA');
  console.log('================================\n');

  const success = await testDeleteCompany();

  console.log('\n================================');
  if (success) {
    console.log('✅ TESTE PASSOU!');
    process.exit(0);
  } else {
    console.log('❌ TESTE FALHOU!');
    process.exit(1);
  }
}

main();

