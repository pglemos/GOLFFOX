const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function createReportSchedulesTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Verificar se a tabela existe
    console.log('\n📋 Verificando tabela gf_report_schedules...');
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gf_report_schedules'
      ) as exists
    `);
    
    const exists = checkResult.rows[0].exists;
    console.log(`  ${exists ? '✅' : '❌'} gf_report_schedules: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);

    if (!exists) {
      console.log('\n🔧 Criando tabela gf_report_schedules...');
      const sqlFile = path.join(__dirname, 'create_report_schedules_table.sql');
      const sql = fs.readFileSync(sqlFile, 'utf8');
      
      await client.query(sql);
      console.log('✅ Tabela criada com sucesso!');
    } else {
      // Verificar se a coluna created_by existe
      console.log('\n📋 Verificando coluna created_by...');
      const columnResult = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'gf_report_schedules'
          AND column_name = 'created_by'
        ) as exists
      `);
      
      const columnExists = columnResult.rows[0].exists;
      console.log(`  ${columnExists ? '✅' : '❌'} created_by: ${columnExists ? 'EXISTE' : 'NÃO EXISTE'}`);
      
      if (!columnExists) {
        console.log('\n🔧 Adicionando coluna created_by...');
        await client.query(`
          ALTER TABLE public.gf_report_schedules 
          ADD COLUMN created_by UUID REFERENCES public.users(id);
        `);
        console.log('✅ Coluna created_by adicionada com sucesso!');
      }
    }

    // Verificar estrutura final
    console.log('\n📋 Verificando estrutura final...');
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'gf_report_schedules'
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas encontradas:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? '[NULLABLE]' : '[NOT NULL]'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

createReportSchedulesTable();

