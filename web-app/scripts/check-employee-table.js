const { Client } = require('pg');
const DB_URL = 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function checkEmployeeTable() {
  const client = new Client({ connectionString: DB_URL });
  
  console.log('🔍 VERIFICANDO TABELA DE FUNCIONÁRIOS\n');
  console.log('═══════════════════════════════════════\n');

  try {
    await client.connect();

    // 1. Verificar se tabela existe
    console.log('1️⃣  Verificando se tabela existe...');
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%employee%'
      ORDER BY table_name
    `);
    
    console.log(`   Tabelas encontradas: ${tables.map(t => t.table_name).join(', ') || 'Nenhuma'}\n`);

    // 2. Se gf_employee_company não existe, tentar outras tabelas
    const targetTable = tables.find(t => t.table_name === 'gf_employee_company')?.table_name || 
                       tables.find(t => t.table_name.includes('employee'))?.table_name;

    if (!targetTable) {
      console.log('❌ Nenhuma tabela de funcionários encontrada!\n');
      console.log('SOLUÇÃO: Criar tabela gf_employee_company\n');
      
      // Criar tabela
      await client.query(`
        CREATE TABLE IF NOT EXISTS gf_employee_company (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id),
          name TEXT NOT NULL,
          cpf TEXT,
          email TEXT,
          phone TEXT,
          is_active BOOLEAN DEFAULT true,
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      
      console.log('✅ Tabela gf_employee_company criada!\n');
      
      // Criar alguns funcionários de teste
      const { rows: [company] } = await client.query(`SELECT id, name FROM companies LIMIT 1`);
      const companyId = company.id;
      
      console.log(`2️⃣  Criando funcionários de teste para: ${company.name}\n`);
      
      const employees = [
        { name: 'João Silva', email: 'joao.silva@empresa.com', phone: '(61) 99999-1111', cpf: '123.456.789-00' },
        { name: 'Maria Santos', email: 'maria.santos@empresa.com', phone: '(61) 99999-2222', cpf: '987.654.321-00' },
        { name: 'Pedro Oliveira', email: 'pedro.oliveira@empresa.com', phone: '(61) 99999-3333', cpf: '111.222.333-44' }
      ];

      for (const emp of employees) {
        await client.query(`
          INSERT INTO gf_employee_company (company_id, name, email, phone, cpf, is_active)
          VALUES ($1, $2, $3, $4, $5, true)
        `, [companyId, emp.name, emp.email, emp.phone, emp.cpf]);
        
        console.log(`   ✓ ${emp.name}`);
      }
      
      console.log(`\n✅ ${employees.length} funcionários criados!\n`);
      
    } else {
      console.log(`2️⃣  Verificando dados na tabela: ${targetTable}...\n`);
      
      // Verificar dados
      const { rows: employees } = await client.query(`
        SELECT 
          e.id, 
          e.company_id, 
          e.name, 
          e.email, 
          e.is_active,
          c.name as company_name
        FROM ${targetTable} e
        LEFT JOIN companies c ON c.id = e.company_id
        LIMIT 10
      `);
      
      if (employees.length === 0) {
        console.log('⚠️  Tabela existe mas está vazia!\n');
        
        // Criar funcionários de teste
        const { rows: [company] } = await client.query(`SELECT id, name FROM companies LIMIT 1`);
        
        console.log(`   Criando funcionários de teste para: ${company.name}\n`);
        
        const testEmployees = [
          { name: 'João Silva', email: 'joao.silva@empresa.com', phone: '(61) 99999-1111', cpf: '123.456.789-00' },
          { name: 'Maria Santos', email: 'maria.santos@empresa.com', phone: '(61) 99999-2222', cpf: '987.654.321-00' },
          { name: 'Pedro Oliveira', email: 'pedro.oliveira@empresa.com', phone: '(61) 99999-3333', cpf: '111.222.333-44' }
        ];

        for (const emp of testEmployees) {
          await client.query(`
            INSERT INTO ${targetTable} (company_id, name, email, phone, cpf, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
          `, [company.id, emp.name, emp.email, emp.phone, emp.cpf]);
          
          console.log(`   ✓ ${emp.name}`);
        }
        
        console.log(`\n✅ ${testEmployees.length} funcionários criados!\n`);
        
      } else {
        console.log(`✅ Tabela tem ${employees.length} funcionário(s):\n`);
        employees.forEach(e => {
          console.log(`   ✓ ${e.name} (${e.email || 'Sem email'}) - ${e.company_name || 'Sem empresa'}`);
        });
        console.log('');
      }
    }

    // 3. Verificar RLS
    console.log('3️⃣  Verificando RLS...');
    const { rows: rlsPolicies } = await client.query(`
      SELECT policyname 
      FROM pg_policies 
      WHERE tablename = 'gf_employee_company'
    `);
    
    if (rlsPolicies.length === 0) {
      console.log('   ⚠️  Sem políticas RLS - criando...\n');
      
      await client.query(`
        ALTER TABLE gf_employee_company ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "admin_full_access_employees" ON gf_employee_company
          FOR ALL TO authenticated 
          USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
        
        CREATE POLICY "operator_company_employees" ON gf_employee_company
          FOR SELECT TO authenticated 
          USING (
            EXISTS (
              SELECT 1 FROM users 
              WHERE id = auth.uid() 
              AND role = 'operator'
              AND company_id = gf_employee_company.company_id
            )
          );
      `);
      
      console.log('   ✅ RLS configurado!\n');
    } else {
      console.log(`   ✅ ${rlsPolicies.length} política(s) RLS ativa(s)\n`);
    }

    console.log('═══════════════════════════════════════');
    console.log('\n🎉 FUNCIONÁRIOS PRONTOS!\n');
    console.log('TESTE AGORA:');
    console.log('https://golffox.vercel.app/operator/funcionarios');
    console.log('\n═══════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

checkEmployeeTable();

