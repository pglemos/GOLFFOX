const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function checkTableStructure() {
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

    // Verificar estrutura da tabela trip_passengers
    console.log('\n📋 Verificando estrutura da tabela trip_passengers...');
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'trip_passengers'
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas encontradas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? '[NULLABLE]' : '[NOT NULL]'}`);
    });

    // Verificar estrutura da tabela trips
    console.log('\n📋 Verificando estrutura da tabela trips...');
    const tripsResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'trips'
      ORDER BY ordinal_position;
    `);
    
    console.log('Colunas encontradas:');
    tripsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? '[NULLABLE]' : '[NOT NULL]'}`);
    });

    // Verificar se há dados
    console.log('\n📊 Verificando dados...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM trip_passengers');
    console.log(`  trip_passengers: ${countResult.rows[0].count} registros`);
    
    const tripsCountResult = await client.query('SELECT COUNT(*) as count FROM trips');
    console.log(`  trips: ${tripsCountResult.rows[0].count} registros`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

checkTableStructure();

