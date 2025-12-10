/**
 * Script para testar conexão e verificar schema via API REST do Supabase
 * Execute com: node scripts/test-supabase-connection.js
 */

const SUPABASE_URL = 'https://vmoxzesvjcfmrebagcwo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTUxNDIxMywiZXhwIjoyMDc3MDkwMjEzfQ.EJylgYksLGJ7icYf77dPULYZNA4u35JRg-gkoGgMI_A';

async function testConnection() {
  console.log('🚀 Testando conexão com Supabase...\n');
  console.log(`📍 URL: ${SUPABASE_URL}`);

  try {
    // Teste 1: Verificar se API está acessível
    console.log('\n📡 Verificando API REST...');
    const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });
    console.log(`   Status: ${healthResponse.status}`);

    // Teste 2: Listar tabelas via users (tabela que sabemos existir)
    console.log('\n📊 Verificando tabela users...');
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,role&limit=5`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (usersResponse.ok) {
      const users = await usersResponse.json();
      console.log(`   ✅ Tabela users acessível! ${users.length} usuário(s) encontrado(s)`);
      users.forEach(u => console.log(`      - ${u.email} (${u.role})`));
    } else {
      const error = await usersResponse.text();
      console.log(`   ⚠️ Erro: ${usersResponse.status} - ${error}`);
    }

    // Teste 3: Verificar tabela carriers
    console.log('\n📊 Verificando tabela carriers...');
    const carriersResponse = await fetch(`${SUPABASE_URL}/rest/v1/carriers?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (carriersResponse.ok) {
      const carriers = await carriersResponse.json();
      console.log(`   ✅ Tabela carriers acessível! ${carriers.length} registro(s)`);

      // Verificar colunas disponíveis
      if (carriers.length > 0) {
        const columns = Object.keys(carriers[0]);
        console.log(`   📌 Colunas encontradas: ${columns.join(', ')}`);

        // Verificar campos bancários
        const bankFields = ['bank_name', 'bank_code', 'bank_agency', 'bank_account', 'pix_key'];
        const legalRepFields = ['legal_rep_name', 'legal_rep_cpf', 'legal_rep_email'];

        console.log('\n   🏦 Campos bancários:');
        bankFields.forEach(f => {
          const exists = columns.includes(f);
          console.log(`      ${exists ? '✅' : '❌'} ${f}`);
        });

        console.log('\n   👤 Campos representante legal:');
        legalRepFields.forEach(f => {
          const exists = columns.includes(f);
          console.log(`      ${exists ? '✅' : '❌'} ${f}`);
        });
      }
    } else {
      const error = await carriersResponse.text();
      console.log(`   ⚠️ Erro: ${carriersResponse.status} - ${error}`);
    }

    // Teste 4: Verificar tabela vehicles
    console.log('\n📊 Verificando tabela vehicles...');
    const vehiclesResponse = await fetch(`${SUPABASE_URL}/rest/v1/vehicles?select=*&limit=1`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (vehiclesResponse.ok) {
      const vehicles = await vehiclesResponse.json();
      console.log(`   ✅ Tabela vehicles acessível! ${vehicles.length} registro(s)`);

      if (vehicles.length > 0) {
        const columns = Object.keys(vehicles[0]);
        console.log(`   📌 Colunas encontradas: ${columns.join(', ')}`);
      }
    } else {
      console.log(`   ⚠️ Status: ${vehiclesResponse.status}`);
    }

    // Teste 5: Verificar tabelas ausentes
    console.log('\n📊 Verificando tabelas que precisam ser criadas...');
    const tablesToCheck = ['driver_positions', 'route_stops', 'trip_events', 'trip_passengers', 'checklists'];

    for (const table of tablesToCheck) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
        }
      });

      const exists = response.ok;
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    }

    console.log('\n🎉 Verificação concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

testConnection();
