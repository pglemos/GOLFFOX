const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function runMigration() {
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

    // Ler os arquivos SQL
    const sqlFile1 = path.join(__dirname, 'fix_missing_columns.sql');
    const sqlFile2 = path.join(__dirname, 'fix_users_name_column.sql');
    const sql1 = fs.readFileSync(sqlFile1, 'utf8');
    const sql2 = fs.readFileSync(sqlFile2, 'utf8');
    const sql = sql1 + '\n\n' + sql2;

    console.log('📝 Executando migrações...');
    
    // Executar o script SQL
    await client.query(sql);
    
    console.log('✅ Migrações executadas com sucesso!');
    
    // Verificar se as colunas foram criadas
    console.log('\n🔍 Verificando colunas criadas...');
    
    const checkCompanies = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'companies' 
      AND column_name = 'is_active'
    `);
    
    if (checkCompanies.rows.length > 0) {
      console.log('✅ Coluna is_active criada na tabela companies');
    } else {
      console.log('⚠️  Coluna is_active já existia na tabela companies');
    }
    
    const checkUsersCpf = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'cpf'
    `);
    
    if (checkUsersCpf.rows.length > 0) {
      console.log('✅ Coluna cpf criada na tabela users');
    } else {
      console.log('⚠️  Coluna cpf já existia na tabela users');
    }
    
    const checkUsersName = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'name'
    `);
    
    if (checkUsersName.rows.length > 0) {
      console.log('✅ Coluna name criada na tabela users');
    } else {
      console.log('⚠️  Coluna name já existia na tabela users');
    }
    
    const checkUsersPhone = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'phone'
    `);
    
    if (checkUsersPhone.rows.length > 0) {
      console.log('✅ Coluna phone criada na tabela users');
    } else {
      console.log('⚠️  Coluna phone já existia na tabela users');
    }
    
    // Listar todas as colunas da tabela users para debug
    const allUsersColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Colunas da tabela users:');
    allUsersColumns.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Verificar views
    console.log('\n🔍 Verificando views criadas...');
    
    const checkView = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'v_admin_dashboard_kpis'
    `);
    
    if (checkView.rows.length > 0) {
      console.log('✅ View v_admin_dashboard_kpis criada');
    } else {
      console.log('⚠️  View v_admin_dashboard_kpis não encontrada');
    }
    
    const checkMV = await client.query(`
      SELECT matviewname 
      FROM pg_matviews 
      WHERE schemaname = 'public' 
      AND matviewname = 'mv_admin_kpis'
    `);
    
    if (checkMV.rows.length > 0) {
      console.log('✅ Materialized view mv_admin_kpis criada');
    } else {
      console.log('⚠️  Materialized view mv_admin_kpis não encontrada');
    }
    
    console.log('\n✨ Migrações concluídas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar migrações:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

runMigration();

