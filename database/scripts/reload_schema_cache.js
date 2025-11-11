const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:Guigui1309@@db.vmoxzesvjcfmrebagcwo.supabase.co:5432/postgres';

async function reloadSchemaCache() {
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

    console.log('🔄 Recarregando cache do schema do Supabase...');
    
    // Recarregar cache do PostgREST (Supabase)
    await client.query("NOTIFY pgrst, 'reload schema'");
    await client.query("SELECT pg_notify('pgrst', 'reload schema')");
    
    console.log('✅ Cache do schema recarregado com sucesso!');
    console.log('⏳ Aguarde alguns minutos para o cache ser atualizado completamente.');
    
  } catch (error) {
    console.error('❌ Erro ao recarregar cache do schema:', error.message);
    console.error('Detalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

reloadSchemaCache();

