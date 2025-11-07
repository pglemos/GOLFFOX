const { Client } = require('pg');
const DB_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function checkCompany() {
  const client = new Client({ connectionString: DB_URL });
  const targetCompanyId = '11111111-1111-4111-8111-1111111111c1';
  
  console.log('🔍 VERIFICANDO COMPANY ESPECÍFICO\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();

    // 1. Verificar se company existe
    console.log(`1️⃣  Verificando company: ${targetCompanyId}...\n`);
    const { rows: companies } = await client.query(`
      SELECT id, name 
      FROM companies 
      WHERE id = $1
    `, [targetCompanyId]);

    if (companies.length === 0) {
      console.log('❌ Company não encontrado!\n');
      console.log('CRIANDO company...\n');
      
      await client.query(`
        INSERT INTO companies (id, name, created_at)
        VALUES ($1, 'Empresa Teste Operator', NOW())
      `, [targetCompanyId]);
      
      console.log('✅ Company criado: Empresa Teste Operator\n');
    } else {
      console.log(`✅ Company encontrado: ${companies[0].name}\n`);
    }

    // 2. Verificar funcionários deste company
    console.log(`2️⃣  Verificando funcionários do company...\n`);
    const { rows: employees } = await client.query(`
      SELECT id, name, email, phone, is_active
      FROM gf_employee_company
      WHERE company_id = $1
      ORDER BY name
    `, [targetCompanyId]);

    if (employees.length === 0) {
      console.log('⚠️  Company não tem funcionários! Criando...\n');
      
      const testEmployees = [
        { name: 'João da Silva', email: 'joao@empresa.com', phone: '(61) 98888-1111', cpf: '111.111.111-11' },
        { name: 'Maria Oliveira', email: 'maria@empresa.com', phone: '(61) 98888-2222', cpf: '222.222.222-22' },
        { name: 'Pedro Santos', email: 'pedro@empresa.com', phone: '(61) 98888-3333', cpf: '333.333.333-33' },
        { name: 'Ana Costa', email: 'ana@empresa.com', phone: '(61) 98888-4444', cpf: '444.444.444-44' },
        { name: 'Carlos Pereira', email: 'carlos@empresa.com', phone: '(61) 98888-5555', cpf: '555.555.555-55' }
      ];

      for (const emp of testEmployees) {
        await client.query(`
          INSERT INTO gf_employee_company (company_id, name, email, phone, cpf, is_active, created_at)
          VALUES ($1, $2, $3, $4, $5, true, NOW())
        `, [targetCompanyId, emp.name, emp.email, emp.phone, emp.cpf]);
        
        console.log(`   ✓ ${emp.name}`);
      }
      
      console.log(`\n✅ ${testEmployees.length} funcionários criados!\n`);
      
    } else {
      console.log(`✅ ${employees.length} funcionário(s) encontrado(s):\n`);
      employees.forEach(e => {
        const status = e.is_active ? '✅ Ativo' : '❌ Inativo';
        console.log(`   ${status} ${e.name} (${e.email || 'Sem email'})`);
      });
      console.log('');
    }

    // 3. Verificar usuário operator com este company
    console.log(`3️⃣  Verificando usuário operator...\n`);
    const { rows: operators } = await client.query(`
      SELECT id, email, role 
      FROM users 
      WHERE role = 'operator' AND company_id = $1
      LIMIT 1
    `, [targetCompanyId]);

    if (operators.length === 0) {
      console.log('⚠️  Nenhum usuário operator para este company\n');
      console.log('   Isso pode causar problemas de RLS!\n');
    } else {
      console.log(`✅ Operator: ${operators[0].email}\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('\n🎉 TUDO PRONTO!\n');
    console.log('TESTE AGORA:');
    console.log(`https://golffox.vercel.app/operator/funcionarios?company=${targetCompanyId}`);
    console.log('\n═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkCompany();

